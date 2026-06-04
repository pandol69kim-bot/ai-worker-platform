import { db } from "@/lib/db";

export const ADMIN_TARGET_STATUSES = ["reviewing", "approved", "published", "rejected"] as const;

export type AdminTargetStatus = (typeof ADMIN_TARGET_STATUSES)[number];

type TransitionResult = {
  ok: boolean;
  reason?: string;
};

type ApplyStatusChangeInput = {
  workerIds: string[];
  reviewerId: string;
  targetStatus: AdminTargetStatus;
  note?: string;
  score?: number;
};

export function canTransitionWorkerStatus(
  currentStatus: string,
  targetStatus: AdminTargetStatus
): TransitionResult {
  if (currentStatus === targetStatus) {
    return { ok: false, reason: "이미 해당 상태입니다." };
  }

  if (currentStatus === "submitted") {
    if (["reviewing", "approved", "rejected"].includes(targetStatus)) {
      return { ok: true };
    }
    return { ok: false, reason: "제출된 AI 직원은 검토 중·승인·반려만 가능합니다." };
  }

  if (currentStatus === "reviewing") {
    if (["approved", "rejected"].includes(targetStatus)) {
      return { ok: true };
    }
    return { ok: false, reason: "검토 중 상태에서는 승인 또는 반려만 가능합니다." };
  }

  if (currentStatus === "approved") {
    if (["published", "rejected"].includes(targetStatus)) {
      return { ok: true };
    }
    return { ok: false, reason: "승인된 AI 직원은 게시 또는 반려만 가능합니다." };
  }

  if (currentStatus === "published") {
    if (["approved", "rejected"].includes(targetStatus)) {
      return { ok: true };
    }
    return { ok: false, reason: "게시된 AI 직원은 승인 또는 반려로만 변경할 수 있습니다." };
  }

  return { ok: false, reason: "현재 상태에서는 관리자 상태 변경을 지원하지 않습니다." };
}

export async function applyAdminWorkerStatusChange({
  workerIds,
  reviewerId,
  targetStatus,
  note,
  score,
}: ApplyStatusChangeInput) {
  const uniqueWorkerIds = Array.from(new Set(workerIds));

  if (uniqueWorkerIds.length === 0) {
    return {
      matchedCount: 0,
      updatedCount: 0,
      skippedCount: 0,
      updatedWorkers: [],
      skipped: [],
    };
  }

  const workers = await db.aIWorker.findMany({
    where: { id: { in: uniqueWorkerIds } },
    orderBy: { updatedAt: "desc" },
  });

  const workerById = new Map(workers.map((worker) => [worker.id, worker]));
  const skipped: Array<{ id: string; reason: string }> = [];
  const updatableWorkers = uniqueWorkerIds.flatMap((workerId) => {
    const worker = workerById.get(workerId);
    if (!worker) {
      skipped.push({ id: workerId, reason: "AI 직원을 찾을 수 없습니다." });
      return [];
    }

    const transition = canTransitionWorkerStatus(worker.status, targetStatus);
    if (!transition.ok) {
      skipped.push({ id: workerId, reason: transition.reason ?? "상태를 변경할 수 없습니다." });
      return [];
    }

    return [worker];
  });

  if (updatableWorkers.length === 0) {
    return {
      matchedCount: uniqueWorkerIds.length,
      updatedCount: 0,
      skippedCount: skipped.length,
      updatedWorkers: [],
      skipped,
    };
  }

  const updateTimestamp = new Date();

  const updatedWorkers = await db.$transaction(async (tx) => {
    const results = [];

    for (const worker of updatableWorkers) {
      await tx.adminReview.create({
        data: {
          workerId: worker.id,
          reviewerId,
          note,
          score,
          status: targetStatus,
        },
      });

      const updatedWorker = await tx.aIWorker.update({
        where: { id: worker.id },
        data: {
          status: targetStatus,
          rejectionNote: targetStatus === "rejected" ? note ?? null : null,
          publishedAt: targetStatus === "published" ? updateTimestamp : worker.publishedAt,
        },
      });

      results.push(updatedWorker);
    }

    return results;
  });

  return {
    matchedCount: uniqueWorkerIds.length,
    updatedCount: updatedWorkers.length,
    skippedCount: skipped.length,
    updatedWorkers,
    skipped,
  };
}