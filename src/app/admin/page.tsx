export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { AdminAiConfigVisibilityToggle } from "@/components/worker/AdminAiConfigVisibilityToggle";
import { auth } from "@/lib/auth";
import { getAIModelLabel, getAIProviderLabel } from "@/lib/ai/catalog";
import { db } from "@/lib/db";
import { CategoryThumbnail } from "@/components/worker/CategoryThumbnail";
import { formatDate, getCategoryLabel, WORKER_STATUSES } from "@/lib/utils";
import { AdminWorkerActions } from "@/components/worker/AdminWorkerActions";
import { PublishedWorkersManager } from "@/components/worker/PublishedWorkersManager";
import { AdminAiKeyManager } from "@/components/worker/AdminAiKeyManager";
import { AdminUserManager } from "@/components/worker/AdminUserManager";
import { Shield, KeyRound, Users, ExternalLink } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (user?.role !== "admin") redirect("/");

  const envKeyStatus = {
    openai: !!process.env.OPENAI_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    claude: !!process.env.ANTHROPIC_API_KEY,
  };

  const [reviewQueue, approvedWorkers, publishedWorkers, rejectedWorkers, reviewing, totalUsers] = await Promise.all([
    db.aIWorker.findMany({
      where: { status: { in: ["submitted", "reviewing"] } },
      include: { maker: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.aIWorker.findMany({
      where: { status: "approved" },
      include: { maker: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.aIWorker.findMany({
      where: { status: "published" },
      include: { maker: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.aIWorker.findMany({
      where: { status: "rejected" },
      include: { maker: { select: { name: true, email: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.aIWorker.count({ where: { status: "reviewing" } }),
    db.user.count(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-start gap-3 sm:items-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
          <Shield className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">관리자 패널</h1>
          <p className="text-gray-500 text-sm mt-0.5">AI 직원 검수 및 플랫폼 관리</p>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-10 grid grid-cols-2 gap-4 xl:grid-cols-6">
        <Link
          href="#users"
          className="rounded-xl border border-violet-200 bg-violet-50 p-5 text-center transition-colors hover:bg-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <div className="text-3xl font-bold text-violet-600">{totalUsers}</div>
          <div className="text-sm text-violet-700 mt-1">전체 회원</div>
        </Link>
        <Link
          href="#review-queue"
          className="rounded-xl border border-yellow-200 bg-yellow-50 p-5 text-center transition-colors hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-500"
        >
          <div className="text-3xl font-bold text-yellow-600">{reviewQueue.length}</div>
          <div className="text-sm text-yellow-700 mt-1">검수 대기</div>
        </Link>
        <Link
          href="#review-queue"
          className="rounded-xl border border-sky-200 bg-sky-50 p-5 text-center transition-colors hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
        >
          <div className="text-3xl font-bold text-sky-600">{reviewing}</div>
          <div className="text-sm text-sky-700 mt-1">검토 중</div>
        </Link>
        <Link
          href="#publish-ready"
          className="rounded-xl border border-green-200 bg-green-50 p-5 text-center transition-colors hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <div className="text-3xl font-bold text-green-600">{approvedWorkers.length}</div>
          <div className="text-sm text-green-700 mt-1">게시 가능</div>
        </Link>
        <Link
          href="#published-workers"
          className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 text-center transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        >
          <div className="text-3xl font-bold text-emerald-600">{publishedWorkers.length}</div>
          <div className="text-sm text-emerald-700 mt-1">게시된 AI 직원</div>
        </Link>
        <Link
          href="#rejected-workers"
          className="rounded-xl border border-red-200 bg-red-50 p-5 text-center transition-colors hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500"
        >
          <div className="text-3xl font-bold text-red-600">{rejectedWorkers.length}</div>
          <div className="text-sm text-red-700 mt-1">반려된 AI 직원</div>
        </Link>
      </div>

      {/* Review queue */}
      <div id="review-queue" className="scroll-mt-24">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">
          검수 대기 목록
          {reviewQueue.length > 0 && (
            <span className="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
              {reviewQueue.length}
            </span>
          )}
        </h2>

        {reviewQueue.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-500">검수 대기 중인 AI 직원이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviewQueue.map((worker) => {
              const statusInfo = WORKER_STATUSES[worker.status as keyof typeof WORKER_STATUSES];
              return (
                <div key={worker.id} className="rounded-xl border border-gray-200 bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 gap-4">
                      <CategoryThumbnail category={worker.category} className="hidden h-16 w-16 shrink-0 sm:block" compact />
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <div className="w-full">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Link href={`/market/${worker.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline">
                              {worker.title}
                            </Link>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                              {statusInfo?.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{worker.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span>카테고리: {getCategoryLabel(worker.category)}</span>
                            <span>AI: {getAIProviderLabel(worker.aiProvider)} · {getAIModelLabel(worker.aiProvider, worker.aiModel)}</span>
                            <span>메이커: {worker.maker.name} ({worker.maker.email})</span>
                            <span>제출: {formatDate(worker.updatedAt)}</span>
                          </div>
                          <div className="mt-3">
                            <AdminAiConfigVisibilityToggle workerId={worker.id} isAiConfigPublic={worker.isAiConfigPublic} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-start lg:self-auto">
                      <Link
                        href={`/market/${worker.id}`}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        상세 보기
                      </Link>
                      <AdminWorkerActions workerId={worker.id} currentStatus={worker.status} />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="font-medium text-gray-700 mb-1">역할 정의</div>
                      <p className="text-gray-500 line-clamp-3">{worker.roleDefinition}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="font-medium text-gray-700 mb-1">업무 플로우</div>
                      <p className="text-gray-500 line-clamp-3">{worker.workflow}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div id="publish-ready" className="mt-10 scroll-mt-24">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">
          게시 가능 목록
          {approvedWorkers.length > 0 && (
            <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              {approvedWorkers.length}
            </span>
          )}
        </h2>

        {approvedWorkers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-500">현재 게시 가능한 AI 직원이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvedWorkers.map((worker) => {
              const statusInfo = WORKER_STATUSES[worker.status as keyof typeof WORKER_STATUSES];
              return (
                <div key={worker.id} className="rounded-xl border border-green-200 bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 gap-4">
                      <CategoryThumbnail category={worker.category} className="hidden h-16 w-16 shrink-0 sm:block" compact />
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <div className="w-full">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <Link href={`/market/${worker.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline">
                              {worker.title}
                            </Link>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                              {statusInfo?.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{worker.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span>카테고리: {getCategoryLabel(worker.category)}</span>
                            <span>AI: {getAIProviderLabel(worker.aiProvider)} · {getAIModelLabel(worker.aiProvider, worker.aiModel)}</span>
                            <span>메이커: {worker.maker.name} ({worker.maker.email})</span>
                            <span>승인: {formatDate(worker.updatedAt)}</span>
                          </div>
                          <div className="mt-3">
                            <AdminAiConfigVisibilityToggle workerId={worker.id} isAiConfigPublic={worker.isAiConfigPublic} />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="self-start lg:self-auto">
                      <AdminWorkerActions workerId={worker.id} currentStatus={worker.status} />
                    </div>
                  </div>

                  <div className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                    검수는 완료되었습니다. `게시` 버튼을 누르면 마켓에 공개됩니다.
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div id="published-workers" className="mt-10 scroll-mt-24">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">
          게시된 AI 직원 목록
          {publishedWorkers.length > 0 && (
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
              {publishedWorkers.length}
            </span>
          )}
        </h2>

        <PublishedWorkersManager workers={publishedWorkers} />
      </div>

      <div id="users" className="mt-10 scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-violet-600" />
          <h2 className="font-semibold text-gray-900 text-lg">회원 관리</h2>
        </div>
        <AdminUserManager />
      </div>

      <div id="ai-keys" className="mt-10 scroll-mt-24">
        <div className="mb-4 flex items-center gap-2">
          <KeyRound className="h-5 w-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900 text-lg">AI API 키 관리</h2>
        </div>
        <AdminAiKeyManager envKeyStatus={envKeyStatus} />
      </div>

      <div id="rejected-workers" className="mt-10 scroll-mt-24">
        <h2 className="font-semibold text-gray-900 text-lg mb-4">
          반려된 AI 직원 목록
          {rejectedWorkers.length > 0 && (
            <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
              {rejectedWorkers.length}
            </span>
          )}
        </h2>

        {rejectedWorkers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center">
            <p className="text-gray-500">현재 반려된 AI 직원이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rejectedWorkers.map((worker) => {
              const statusInfo = WORKER_STATUSES[worker.status as keyof typeof WORKER_STATUSES];

              return (
                <div key={worker.id} className="rounded-xl border border-red-200 bg-white p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex flex-1 gap-4">
                      <CategoryThumbnail category={worker.category} className="hidden h-16 w-16 shrink-0 sm:block" compact />
                      <div className="w-full">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <Link href={`/market/${worker.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline">
                            {worker.title}
                          </Link>
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                            {statusInfo?.label}
                          </span>
                        </div>
                        <p className="mb-2 line-clamp-2 text-sm text-gray-500">{worker.description}</p>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                          <span>카테고리: {getCategoryLabel(worker.category)}</span>
                          <span>AI: {getAIProviderLabel(worker.aiProvider)} · {getAIModelLabel(worker.aiProvider, worker.aiModel)}</span>
                          <span>메이커: {worker.maker.name} ({worker.maker.email})</span>
                          <span>반려: {formatDate(worker.updatedAt)}</span>
                        </div>
                        <div className="mt-3">
                          <AdminAiConfigVisibilityToggle workerId={worker.id} isAiConfigPublic={worker.isAiConfigPublic} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 lg:grid-cols-3">
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="mb-1 font-medium text-gray-700">역할 정의</div>
                      <p className="line-clamp-3 text-gray-500">{worker.roleDefinition}</p>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <div className="mb-1 font-medium text-gray-700">업무 플로우</div>
                      <p className="line-clamp-3 text-gray-500">{worker.workflow}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-3">
                      <div className="mb-1 font-medium text-red-700">반려 사유</div>
                      <p className="line-clamp-4 text-red-600">
                        {worker.rejectionNote?.trim() || "반려 사유가 입력되지 않았습니다."}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
