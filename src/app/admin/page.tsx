export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { CategoryThumbnail } from "@/components/worker/CategoryThumbnail";
import { formatDate, getCategoryLabel, WORKER_STATUSES } from "@/lib/utils";
import { AdminWorkerActions } from "@/components/worker/AdminWorkerActions";
import { Shield } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (user?.role !== "admin") redirect("/");

  const [reviewQueue, approvedWorkers, reviewing, stats] = await Promise.all([
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
    db.aIWorker.count({ where: { status: "reviewing" } }),
    Promise.all([
      db.aIWorker.count({ where: { status: "published" } }),
      db.user.count(),
      db.purchase.count({ where: { paymentStatus: "completed" } }),
    ]),
  ]);

  const [published, userCount, saleCount] = stats;

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
      <div className="mb-10 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <div className="text-3xl font-bold text-yellow-600">{reviewQueue.length}</div>
          <div className="text-sm text-gray-500 mt-1">검수 대기</div>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <div className="text-3xl font-bold text-blue-600">{reviewing}</div>
          <div className="text-sm text-gray-500 mt-1">검토 중</div>
        </div>
        <Link
          href="#publish-ready"
          className="rounded-xl border border-green-200 bg-green-50 p-5 text-center transition-colors hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500"
        >
          <div className="text-3xl font-bold text-green-600">{approvedWorkers.length}</div>
          <div className="text-sm text-green-700 mt-1">게시 가능</div>
        </Link>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <div className="text-3xl font-bold text-emerald-600">{published}</div>
          <div className="text-sm text-gray-500 mt-1">게시된 AI 직원</div>
        </div>
      </div>

      {/* Review queue */}
      <div>
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
                            <h3 className="font-semibold text-gray-900">{worker.title}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                              {statusInfo?.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{worker.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span>카테고리: {getCategoryLabel(worker.category)}</span>
                            <span>메이커: {worker.maker.name} ({worker.maker.email})</span>
                            <span>제출: {formatDate(worker.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="self-start lg:self-auto">
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
                            <h3 className="font-semibold text-gray-900">{worker.title}</h3>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                              {statusInfo?.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500 mb-2 line-clamp-2">{worker.description}</p>
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                            <span>카테고리: {getCategoryLabel(worker.category)}</span>
                            <span>메이커: {worker.maker.name} ({worker.maker.email})</span>
                            <span>승인: {formatDate(worker.updatedAt)}</span>
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
    </div>
  );
}
