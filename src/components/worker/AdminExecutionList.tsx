"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  Search,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getAIModelLabel, getAIProviderLabel } from "@/lib/ai/catalog";
import { getCategoryLabel } from "@/lib/utils";

type ExecutionItem = {
  id: string;
  workerId: string;
  userId: string | null;
  provider: string | null;
  model: string | null;
  input: string;
  output: string | null;
  status: string;
  error: string | null;
  tokens: number | null;
  duration: number | null;
  createdAt: string;
  worker: { id: string; title: string; category: string };
};

type ApiResponse = {
  items: ExecutionItem[];
  nextCursor: string | null;
  total: number;
};

const STATUS_STYLES: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  completed: { label: "완료", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300", icon: <Zap className="h-3 w-3" /> },
  failed:    { label: "실패", color: "bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300", icon: <AlertCircle className="h-3 w-3" /> },
  running:   { label: "실행 중", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300", icon: <Loader2 className="h-3 w-3 animate-spin" /> },
  pending:   { label: "대기", color: "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-slate-300", icon: <Clock className="h-3 w-3" /> },
};

export function AdminExecutionList() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchExecutions = useCallback(async () => {
    setLoading(true);
    setExpandedId(null);
    const params = new URLSearchParams();
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/admin/executions?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [debouncedSearch, statusFilter]);

  useEffect(() => { fetchExecutions(); }, [fetchExecutions]);

  async function handleLoadMore() {
    if (!data?.nextCursor) return;
    setLoadingMore(true);
    const params = new URLSearchParams({ cursor: data.nextCursor });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/admin/executions?${params}`);
    if (res.ok) {
      const more: ApiResponse = await res.json();
      setData((prev) =>
        prev
          ? { ...more, items: [...prev.items, ...more.items] }
          : more
      );
    }
    setLoadingMore(false);
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="AI 직원명 또는 사용자 검색"
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            <SelectItem value="completed">완료</SelectItem>
            <SelectItem value="failed">실패</SelectItem>
            <SelectItem value="running">실행 중</SelectItem>
            <SelectItem value="pending">대기</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 총 건수 */}
      {data && (
        <p className="text-sm text-gray-500 dark:text-slate-400">
          전체 <span className="font-medium text-gray-900 dark:text-slate-100">{data.total.toLocaleString()}</span>건
          {data.items.length < data.total && (
            <span className="ml-1 text-gray-400 dark:text-slate-500">
              (최근 {data.items.length}건 표시)
            </span>
          )}
        </p>
      )}

      {/* 목록 */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center dark:border-slate-700">
          <Zap className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-slate-600" />
          <p className="text-gray-500 dark:text-slate-400">실행 기록이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {data.items.map((ex) => {
            const status = STATUS_STYLES[ex.status] ?? STATUS_STYLES.pending;
            const isExpanded = expandedId === ex.id;

            return (
              <div
                key={ex.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-slate-700 dark:bg-slate-900"
              >
                {/* 헤더 행 */}
                <button
                  type="button"
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-slate-800"
                  onClick={() => toggleExpand(ex.id)}
                >
                  {/* 상태 배지 */}
                  <span className={`mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <span className="font-medium text-sm text-gray-900 dark:text-slate-100 truncate">
                        {ex.worker.title}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {getCategoryLabel(ex.worker.category)}
                      </span>
                    </div>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400 dark:text-slate-500">
                      {ex.provider && (
                        <span>{getAIProviderLabel(ex.provider)} · {ex.model ? getAIModelLabel(ex.provider, ex.model) : ex.model}</span>
                      )}
                      {ex.tokens && <span>{ex.tokens.toLocaleString()} 토큰</span>}
                      {ex.duration && <span>{(ex.duration / 1000).toFixed(1)}초</span>}
                      <span>{new Date(ex.createdAt).toLocaleString("ko-KR")}</span>
                    </div>
                  </div>

                  {isExpanded
                    ? <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                    : <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                  }
                </button>

                {/* 펼침: 입력/출력/에러 */}
                {isExpanded && (
                  <div className="border-t border-gray-100 px-4 py-3 space-y-3 dark:border-slate-700 dark:bg-slate-800/50">
                    <div>
                      <p className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">입력</p>
                      <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700 leading-relaxed dark:bg-slate-900 dark:text-slate-300">
                        {ex.input}
                      </pre>
                    </div>

                    {ex.output && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-500 dark:text-slate-400">출력</p>
                        <pre className="whitespace-pre-wrap rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-700 leading-relaxed dark:bg-slate-900 dark:text-slate-300">
                          {ex.output}
                        </pre>
                      </div>
                    )}

                    {ex.error && (
                      <div>
                        <p className="mb-1 text-xs font-medium text-red-500">오류</p>
                        <pre className="whitespace-pre-wrap rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 leading-relaxed dark:bg-red-950/40 dark:text-red-400">
                          {ex.error}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 더 보기 */}
      {data?.nextCursor && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="gap-2"
          >
            {loadingMore
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <ChevronDown className="h-4 w-4" />
            }
            더 보기
          </Button>
        </div>
      )}
    </div>
  );
}
