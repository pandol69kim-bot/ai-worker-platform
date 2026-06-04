import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ADMIN_TARGET_STATUSES, applyAdminWorkerStatusChange } from "@/lib/admin-worker-status";
import { z } from "zod";

const bulkStatusChangeSchema = z
  .object({
    targetStatus: z.enum(ADMIN_TARGET_STATUSES),
    scope: z.enum(["ids", "all"]),
    ids: z.array(z.string().min(1)).optional(),
    currentStatus: z.string().min(1).optional(),
    note: z.string().trim().max(500).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.scope === "ids" && (!data.ids || data.ids.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "선택 변경에는 하나 이상의 AI 직원 ID가 필요합니다.",
        path: ["ids"],
      });
    }

    if (data.scope === "all" && !data.currentStatus) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "전체 변경에는 현재 상태 조건이 필요합니다.",
        path: ["currentStatus"],
      });
    }
  });

export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? "submitted";

  const workers = await db.aIWorker.findMany({
    where: status === "all" ? {} : { status },
    include: {
      maker: { select: { id: true, name: true, email: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(workers);
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (user?.role !== "admin" || !user.id) {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { targetStatus, scope, ids, currentStatus, note } = bulkStatusChangeSchema.parse(body);

    const workerIds =
      scope === "ids"
        ? Array.from(new Set(ids ?? []))
        : (
            await db.aIWorker.findMany({
              where: { status: currentStatus },
              select: { id: true },
              orderBy: { updatedAt: "desc" },
            })
          ).map((worker) => worker.id);

    const result = await applyAdminWorkerStatusChange({
      workerIds,
      reviewerId: user.id,
      targetStatus,
      note,
    });

    return NextResponse.json({
      ...result,
      message:
        scope === "all"
          ? `${result.updatedCount}개의 AI 직원 상태가 변경되었습니다.`
          : `${result.updatedCount}개의 선택 항목 상태가 변경되었습니다.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
