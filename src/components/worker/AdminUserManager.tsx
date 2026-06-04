"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BotMessageSquare,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Loader2,
  Search,
  Users,
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
import { getCategoryLabel, WORKER_STATUSES } from "@/lib/utils";

type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  image: string | null;
  createdAt: string;
  _count: { aiWorkers: number; purchases: number };
};

type WorkerRow = {
  id: string;
  title: string;
  status: string;
  category: string;
  aiProvider: string;
  aiModel: string;
  createdAt: string;
  maker: { id: string; name: string | null; email: string; role: string };
};

type UsersResponse = {
  users: UserRow[];
  total: number;
  page: number;
  limit: number;
};

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  admin: { label: "관리자", color: "bg-purple-100 text-purple-700" },
  maker: { label: "메이커", color: "bg-blue-100 text-blue-700" },
  user: { label: "일반 사용자", color: "bg-gray-100 text-gray-600" },
};

const WORKER_STATUS_FILTER_OPTIONS = [
  { value: "all", label: "전체 상태" },
  { value: "draft", label: "초안" },
  { value: "submitted", label: "검수 대기" },
  { value: "reviewing", label: "검토 중" },
  { value: "approved", label: "승인됨" },
  { value: "published", label: "게시됨" },
  { value: "rejected", label: "반려됨" },
];

export function AdminUserManager() {
  const [userData, setUserData] = useState<UsersResponse | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // 역할 필터 → AI 직원 섹션
  const [workers, setWorkers] = useState<WorkerRow[]>([]);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [workerStatusFilter, setWorkerStatusFilter] = useState("all");

  // 회원 클릭 → 소속 AI 직원 펼침
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userWorkersCache, setUserWorkersCache] = useState<Record<string, WorkerRow[]>>({});
  const [userWorkersLoading, setUserWorkersLoading] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const fetchUsers = useCallback(async () => {
    setUserLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (roleFilter !== "all") params.set("role", roleFilter);
    const res = await fetch(`/api/admin/users?${params}`);
    if (res.ok) setUserData(await res.json());
    setUserLoading(false);
  }, [page, debouncedSearch, roleFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const fetchWorkers = useCallback(async () => {
    if (roleFilter === "all") { setWorkers([]); return; }
    setWorkerLoading(true);
    const params = new URLSearchParams({ makerRole: roleFilter, status: workerStatusFilter });
    const res = await fetch(`/api/admin/workers?${params}`);
    if (res.ok) setWorkers(await res.json());
    setWorkerLoading(false);
  }, [roleFilter, workerStatusFilter]);

  useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  function handleRoleFilter(value: string) {
    setRoleFilter(value);
    setPage(1);
    setWorkerStatusFilter("all");
  }

  async function handleUserClick(userId: string, workerCount: number) {
    if (workerCount === 0) return;
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);
    if (userWorkersCache[userId]) return;
    setUserWorkersLoading(userId);
    const res = await fetch(`/api/admin/workers?makerId=${userId}&status=all`);
    if (res.ok) {
      const data = await res.json();
      setUserWorkersCache((prev) => ({ ...prev, [userId]: data }));
    }
    setUserWorkersLoading(null);
  }

  async function handleRoleChange(userId: string, newRole: string) {
    setUpdatingId(userId);
    const res = await fetch(`/api/admin/users?id=${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUserData((prev) =>
        prev
          ? { ...prev, users: prev.users.map((u) => (u.id === updated.id ? { ...u, role: updated.role } : u)) }
          : prev
      );
    }
    setUpdatingId(null);
  }

  const totalPages = userData ? Math.ceil(userData.total / userData.limit) : 1;
  const roleLabel = ROLE_LABELS[roleFilter];

  return (
    <div className="space-y-6">

      {/* ── 검색 + 역할 필터 ── */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름 또는 이메일로 검색"
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={handleRoleFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="전체 역할" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 역할</SelectItem>
            <SelectItem value="user">일반 사용자</SelectItem>
            <SelectItem value="maker">메이커</SelectItem>
            <SelectItem value="admin">관리자</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── 회원 목록 ── */}
      <div className="space-y-3">
        {userData && (
          <p className="text-sm text-gray-500">
            <span className="font-medium text-gray-900">{userData.total}</span>명
            {roleFilter !== "all" && roleLabel && (
              <span className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${roleLabel.color}`}>
                {roleLabel.label}
              </span>
            )}
            {debouncedSearch && ` · "${debouncedSearch}" 검색 결과`}
          </p>
        )}

        {userLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
          </div>
        ) : !userData || userData.users.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
            <p className="text-gray-500">
              {debouncedSearch || roleFilter !== "all" ? "검색 결과가 없습니다." : "등록된 회원이 없습니다."}
            </p>
          </div>
        ) : (
          <>
            {/* 모바일 카드 뷰 (< sm) */}
            <div className="space-y-2 sm:hidden">
              {userData.users.map((u) => {
                const roleInfo = ROLE_LABELS[u.role] ?? ROLE_LABELS.user;
                const isExpanded = expandedUserId === u.id;
                const isLoadingWorkers = userWorkersLoading === u.id;
                const userWorkers = userWorkersCache[u.id] ?? [];
                const hasWorkers = u._count.aiWorkers > 0;

                return (
                  <div key={u.id} className={`rounded-xl border bg-white ${isExpanded ? "border-indigo-200" : "border-gray-200"}`}>
                    <div className="p-3">
                      <button
                        type="button"
                        className={`flex w-full items-center gap-2.5 text-left ${hasWorkers ? "cursor-pointer" : ""}`}
                        onClick={() => handleUserClick(u.id, u._count.aiWorkers)}
                      >
                        {u.image ? (
                          <img src={u.image} alt="" className="h-8 w-8 shrink-0 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                            {(u.name ?? u.email)[0].toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-medium text-sm text-gray-900">{u.name ?? "—"}</div>
                          <div className="truncate text-xs text-gray-400">{u.email}</div>
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${roleInfo.color}`}>
                          {roleInfo.label}
                        </span>
                        {hasWorkers && (
                          isExpanded
                            ? <ChevronUp className="h-4 w-4 shrink-0 text-indigo-400" />
                            : <ChevronDown className="h-4 w-4 shrink-0 text-gray-400" />
                        )}
                      </button>
                      <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)} disabled={updatingId === u.id}>
                          <SelectTrigger className="h-7 flex-1 text-xs">
                            {updatingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">일반 사용자</SelectItem>
                            <SelectItem value="maker">메이커</SelectItem>
                            <SelectItem value="admin">관리자</SelectItem>
                          </SelectContent>
                        </Select>
                        <span className={`text-xs ${hasWorkers ? "font-medium text-indigo-600" : "text-gray-400"}`}>
                          AI {u._count.aiWorkers}개
                        </span>
                        <span className="text-xs text-gray-400">구매 {u._count.purchases}건</span>
                      </div>
                    </div>

                    {/* 펼침: 소속 AI 직원 */}
                    {isExpanded && (
                      <div className="border-t border-indigo-100 bg-indigo-50/40 px-3 py-2.5 dark:border-indigo-900 dark:bg-indigo-950/30">
                        {isLoadingWorkers ? (
                          <div className="flex justify-center py-3">
                            <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                          </div>
                        ) : userWorkers.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-2">AI 직원이 없습니다.</p>
                        ) : (
                          <div className="space-y-1.5">
                            {userWorkers.map((w) => {
                              const statusInfo = WORKER_STATUSES[w.status as keyof typeof WORKER_STATUSES];
                              return (
                                <div key={w.id} className="flex items-center justify-between gap-2 rounded-lg border border-indigo-100 bg-white px-2.5 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800">
                                  <span className="truncate font-medium text-gray-800 dark:text-slate-200">{w.title}</span>
                                  <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-600"}`}>
                                    {statusInfo?.label ?? w.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 데스크탑 테이블 뷰 (sm+) */}
            <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white sm:block">
              <table className="admin-table w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                    <th className="px-4 py-3 font-medium">회원</th>
                    <th className="px-4 py-3 font-medium">역할</th>
                    <th className="hidden px-4 py-3 font-medium sm:table-cell">AI 직원</th>
                    <th className="hidden px-4 py-3 font-medium md:table-cell">구매</th>
                    <th className="hidden px-4 py-3 font-medium lg:table-cell">가입일</th>
                    <th className="w-8 px-2 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {userData.users.map((u) => {
                    const roleInfo = ROLE_LABELS[u.role] ?? ROLE_LABELS.user;
                    const isExpanded = expandedUserId === u.id;
                    const isLoadingWorkers = userWorkersLoading === u.id;
                    const userWorkers = userWorkersCache[u.id] ?? [];
                    const hasWorkers = u._count.aiWorkers > 0;

                    return (
                      <>
                        <tr
                          key={u.id}
                          className={`${hasWorkers ? "cursor-pointer" : ""} ${isExpanded ? "bg-indigo-50/40" : "hover:bg-gray-50"}`}
                          onClick={() => handleUserClick(u.id, u._count.aiWorkers)}
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              {u.image ? (
                                <img src={u.image} alt="" className="h-8 w-8 rounded-full object-cover" />
                              ) : (
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-medium text-indigo-600">
                                  {(u.name ?? u.email)[0].toUpperCase()}
                                </div>
                              )}
                              <div className="min-w-0">
                                <div className="font-medium text-gray-900">{u.name ?? "—"}</div>
                                <div className="truncate text-xs text-gray-400 max-w-45">{u.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${roleInfo.color}`}>
                                {roleInfo.label}
                              </span>
                              <Select value={u.role} onValueChange={(v) => handleRoleChange(u.id, v)} disabled={updatingId === u.id}>
                                <SelectTrigger className="h-7 w-24 text-xs">
                                  {updatingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <SelectValue />}
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">일반 사용자</SelectItem>
                                  <SelectItem value="maker">메이커</SelectItem>
                                  <SelectItem value="admin">관리자</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </td>
                          <td className="hidden px-4 py-3 sm:table-cell">
                            <span className={hasWorkers ? "font-medium text-indigo-600" : "text-gray-400"}>
                              {u._count.aiWorkers}개
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-gray-600 md:table-cell">{u._count.purchases}건</td>
                          <td className="hidden px-4 py-3 text-gray-400 lg:table-cell">
                            {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                          </td>
                          <td className="px-2 py-3 text-gray-400">
                            {isLoadingWorkers ? (
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
                            ) : hasWorkers ? (
                              isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            ) : null}
                          </td>
                        </tr>

                        {/* 펼침: 소속 AI 직원 */}
                        {isExpanded && (
                          <tr key={`${u.id}-workers`}>
                            <td colSpan={6} className="bg-indigo-50/30 px-4 pb-3 pt-1">
                              <div className="ml-11 space-y-1.5">
                                <p className="mb-1.5 text-xs font-medium text-indigo-600">AI 직원 목록</p>
                                {userWorkers.length === 0 ? (
                                  <p className="text-xs text-gray-400">AI 직원이 없습니다.</p>
                                ) : (
                                  userWorkers.map((w) => {
                                    const statusInfo = WORKER_STATUSES[w.status as keyof typeof WORKER_STATUSES];
                                    return (
                                      <div key={w.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-indigo-100 bg-white px-3 py-2 text-xs">
                                        <span className="font-medium text-gray-800">{w.title}</span>
                                        <span className={`rounded-full px-1.5 py-0.5 font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-600"}`}>
                                          {statusInfo?.label ?? w.status}
                                        </span>
                                        <span className="text-gray-400">{getCategoryLabel(w.category)}</span>
                                        <span className="text-gray-400">{getAIProviderLabel(w.aiProvider)} · {getAIModelLabel(w.aiProvider, w.aiModel)}</span>
                                        <span className="ml-auto text-gray-300">{new Date(w.createdAt).toLocaleDateString("ko-KR")}</span>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">{page} / {totalPages} 페이지</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || userLoading}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages || userLoading}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── AI 직원 목록 (역할 필터 선택 시 표시) ── */}
      {roleFilter !== "all" && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <BotMessageSquare className="h-4 w-4 text-indigo-600" />
              <h3 className="font-medium text-gray-900 text-sm">
                {roleLabel?.label} 회원의 AI 직원
              </h3>
              {!workerLoading && (
                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  {workers.length}개
                </span>
              )}
            </div>
            <Select value={workerStatusFilter} onValueChange={setWorkerStatusFilter}>
              <SelectTrigger className="h-8 w-full text-xs sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WORKER_STATUS_FILTER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {workerLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : workers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 py-8 text-center">
              <p className="text-sm text-gray-400">해당 역할 회원의 AI 직원이 없습니다.</p>
            </div>
          ) : (
            <>
              {/* 모바일 카드 뷰 (< sm) */}
              <div className="space-y-2 sm:hidden">
                {workers.map((w) => {
                  const statusInfo = WORKER_STATUSES[w.status as keyof typeof WORKER_STATUSES];
                  return (
                    <div key={w.id} className="rounded-xl border border-gray-200 bg-white p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900 leading-snug">{w.title}</span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-600"}`}>
                          {statusInfo?.label ?? w.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {getCategoryLabel(w.category)} · {getAIProviderLabel(w.aiProvider)}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {w.maker.name ?? w.maker.email}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 데스크탑 테이블 뷰 (sm+) */}
              <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white sm:block">
                <table className="admin-table w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs text-gray-500">
                      <th className="px-4 py-3 font-medium">AI 직원</th>
                      <th className="px-4 py-3 font-medium">상태</th>
                      <th className="hidden px-4 py-3 font-medium sm:table-cell">카테고리</th>
                      <th className="hidden px-4 py-3 font-medium md:table-cell">AI 모델</th>
                      <th className="hidden px-4 py-3 font-medium lg:table-cell">메이커</th>
                      <th className="hidden px-4 py-3 font-medium xl:table-cell">생성일</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {workers.map((w) => {
                      const statusInfo = WORKER_STATUSES[w.status as keyof typeof WORKER_STATUSES];
                      return (
                        <tr key={w.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">{w.title}</td>
                          <td className="px-4 py-3">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-600"}`}>
                              {statusInfo?.label ?? w.status}
                            </span>
                          </td>
                          <td className="hidden px-4 py-3 text-gray-500 sm:table-cell">{getCategoryLabel(w.category)}</td>
                          <td className="hidden px-4 py-3 text-gray-500 md:table-cell">
                            {getAIProviderLabel(w.aiProvider)} · {getAIModelLabel(w.aiProvider, w.aiModel)}
                          </td>
                          <td className="hidden px-4 py-3 lg:table-cell">
                            <div className="text-gray-800">{w.maker.name ?? "—"}</div>
                            <div className="text-xs text-gray-400">{w.maker.email}</div>
                          </td>
                          <td className="hidden px-4 py-3 text-gray-400 xl:table-cell">
                            {new Date(w.createdAt).toLocaleDateString("ko-KR")}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
