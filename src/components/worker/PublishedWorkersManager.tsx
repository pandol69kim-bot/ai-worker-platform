"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CategoryThumbnail } from "@/components/worker/CategoryThumbnail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type AdminTargetStatus } from "@/lib/admin-worker-status";
import { formatDate, getCategoryLabel, WORKER_STATUSES } from "@/lib/utils";

type PublishedWorker = {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  totalSales: number;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
  maker: {
    name: string | null;
    email: string | null;
  };
};

type PublishedWorkersManagerProps = {
  workers: PublishedWorker[];
};

const STATUS_OPTIONS: Array<{ value: Extract<AdminTargetStatus, "approved" | "rejected">; label: string }> = [
  { value: "approved", label: "승인됨으로 변경" },
  { value: "rejected", label: "반려로 변경" },
];

export function PublishedWorkersManager({ workers }: PublishedWorkersManagerProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [targetStatus, setTargetStatus] = useState<Extract<AdminTargetStatus, "approved" | "rejected">>("approved");
  const [note, setNote] = useState("");
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedIdSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const allSelected = workers.length > 0 && selectedIds.length === workers.length;

  function toggleSelection(workerId: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(workerId)
        ? currentIds.filter((currentId) => currentId !== workerId)
        : [...currentIds, workerId]
    );
  }

  function toggleAllSelections() {
    setSelectedIds((currentIds) => (currentIds.length === workers.length ? [] : workers.map((worker) => worker.id)));
  }

  async function submitStatusChange(input: {
    scope: "ids" | "all";
    ids?: string[];
    nextStatus: Extract<AdminTargetStatus, "approved" | "rejected">;
    confirmMessage: string;
    loadingValue: string;
  }) {
    if (!confirm(input.confirmMessage)) {
      return;
    }

    setLoadingKey(input.loadingValue);
    setFeedback(null);
    setError(null);

    try {
      const response = await fetch("/api/admin/workers", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetStatus: input.nextStatus,
          scope: input.scope,
          ids: input.ids,
          currentStatus: "published",
          note: note || undefined,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        updatedCount?: number;
        skippedCount?: number;
      };

      if (!response.ok) {
        setError(payload.error ?? "상태 변경에 실패했습니다.");
        return;
      }

      setFeedback(
        payload.skippedCount
          ? `${payload.message ?? "상태가 변경되었습니다."} ${payload.skippedCount}개는 변경되지 않았습니다.`
          : payload.message ?? "상태가 변경되었습니다."
      );
      setSelectedIds([]);
      router.refresh();
    } catch {
      setError("상태 변경 중 오류가 발생했습니다.");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h3 className="text-base font-semibold text-emerald-900">게시된 AI 직원 상태 일괄 변경</h3>
            <p className="mt-1 text-sm text-emerald-800/80">
              게시된 항목을 선택해서 승인 상태로 되돌리거나 반려로 전환할 수 있습니다.
            </p>
          </div>
          <div className="text-sm text-emerald-900">
            전체 {workers.length}개 중 {selectedIds.length}개 선택됨
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto_auto]">
          <Select value={targetStatus} onValueChange={(value) => setTargetStatus(value as Extract<AdminTargetStatus, "approved" | "rejected">)}>
            <SelectTrigger>
              <SelectValue placeholder="변경할 상태 선택" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="변경 메모 또는 반려 사유 (선택)"
            maxLength={500}
          />

          <Button
            type="button"
            variant="outline"
            disabled={selectedIds.length === 0 || !!loadingKey}
            onClick={() =>
              submitStatusChange({
                scope: "ids",
                ids: selectedIds,
                nextStatus: targetStatus,
                confirmMessage: `선택한 ${selectedIds.length}개의 AI 직원을 ${STATUS_OPTIONS.find((option) => option.value === targetStatus)?.label ?? targetStatus} 하시겠습니까?`,
                loadingValue: "selected",
              })
            }
          >
            {loadingKey === "selected" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            선택 변경
          </Button>

          <Button
            type="button"
            variant="success"
            disabled={workers.length === 0 || !!loadingKey}
            onClick={() =>
              submitStatusChange({
                scope: "all",
                nextStatus: targetStatus,
                confirmMessage: `게시된 AI 직원 ${workers.length}개 전체를 ${STATUS_OPTIONS.find((option) => option.value === targetStatus)?.label ?? targetStatus} 하시겠습니까?`,
                loadingValue: "all",
              })
            }
          >
            {loadingKey === "all" ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            전체 변경
          </Button>
        </div>

        {feedback ? <p className="mt-3 text-sm text-emerald-800">{feedback}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </div>

      {workers.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
          <p className="text-gray-500">현재 게시된 AI 직원이 없습니다</p>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAllSelections}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            현재 목록 전체 선택
          </label>

          {workers.map((worker) => {
            const statusInfo = WORKER_STATUSES[worker.status as keyof typeof WORKER_STATUSES];
            const isSelected = selectedIdSet.has(worker.id);

            return (
              <div key={worker.id} className="rounded-xl border border-emerald-200 bg-white p-5">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="flex flex-1 gap-4">
                    <label className="mt-2 flex shrink-0 items-start">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelection(worker.id)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </label>

                    <CategoryThumbnail category={worker.category} className="hidden h-16 w-16 shrink-0 sm:block" compact />

                    <div className="w-full min-w-0">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900">{worker.title}</h3>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                          {statusInfo?.label ?? worker.status}
                        </span>
                      </div>

                      <p className="mb-2 text-sm text-gray-500 line-clamp-2">{worker.description}</p>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span>카테고리: {getCategoryLabel(worker.category)}</span>
                        <span>메이커: {worker.maker.name} ({worker.maker.email})</span>
                        <span>게시: {formatDate(worker.publishedAt ?? worker.updatedAt)}</span>
                        <span>도입: {worker.totalSales}건</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!!loadingKey}
                      onClick={() =>
                        submitStatusChange({
                          scope: "ids",
                          ids: [worker.id],
                          nextStatus: "approved",
                          confirmMessage: `"${worker.title}"을 승인됨 상태로 되돌리시겠습니까?`,
                          loadingValue: `single-approved-${worker.id}`,
                        })
                      }
                    >
                      {loadingKey === `single-approved-${worker.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      승인으로 변경
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      disabled={!!loadingKey}
                      onClick={() =>
                        submitStatusChange({
                          scope: "ids",
                          ids: [worker.id],
                          nextStatus: "rejected",
                          confirmMessage: `"${worker.title}"을 반려 상태로 변경하시겠습니까?`,
                          loadingValue: `single-rejected-${worker.id}`,
                        })
                      }
                    >
                      {loadingKey === `single-rejected-${worker.id}` ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      반려로 변경
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}