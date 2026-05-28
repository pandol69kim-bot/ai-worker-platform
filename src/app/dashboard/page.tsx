export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { syncPurchasePaymentStatus } from "@/lib/payments";
import { formatDate, formatPrice, getCategoryLabel, WORKER_STATUSES } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Star, DollarSign, Bot } from "lucide-react";

interface DashboardPageProps {
  searchParams: Promise<{
    purchase_id?: string;
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string; role?: string };
  const params = await searchParams;
  const purchaseId = params.purchase_id;
  const purchaseSync = purchaseId
    ? await syncPurchasePaymentStatus(purchaseId, user.id)
    : null;

  const [myWorkers, purchases, makerProfile] = await Promise.all([
    db.aIWorker.findMany({
      where: { makerId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    db.purchase.findMany({
      where: { userId: user.id, paymentStatus: "completed" },
      include: {
        worker: { select: { id: true, title: true, category: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    db.makerProfile.findUnique({ where: { userId: user.id } }),
  ]);

  const publishedWorkers = myWorkers.filter((w) => w.status === "published");
  const totalSales = publishedWorkers.reduce((sum, w) => sum + w.totalSales, 0);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">대시보드</h1>

      {purchaseSync?.status === "completed" && (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          테스트 결제가 완료되었습니다. 도입한 AI 직원 목록에서 바로 사용할 수 있습니다.
        </div>
      )}

      {purchaseSync?.status === "pending" && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          결제 확인을 기다리고 있습니다. 잠시 후 새로고침하면 반영됩니다.
        </div>
      )}

      {purchaseSync?.status === "failed" && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          결제가 완료되지 않았습니다. 다시 시도해 주세요.
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-10">
        {[
          {
            icon: <Bot className="h-5 w-5 text-indigo-600" />,
            bg: "bg-indigo-50",
            label: "내 AI 직원",
            value: myWorkers.length,
            sub: `${publishedWorkers.length}개 게시 중`,
          },
          {
            icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
            bg: "bg-emerald-50",
            label: "총 판매 수",
            value: totalSales,
            sub: "누적 도입 수",
          },
          {
            icon: <DollarSign className="h-5 w-5 text-yellow-600" />,
            bg: "bg-yellow-50",
            label: "총 수익",
            value: formatPrice(makerProfile?.totalEarned ?? 0),
            sub: "80% 메이커 수익",
          },
          {
            icon: <Package className="h-5 w-5 text-purple-600" />,
            bg: "bg-purple-50",
            label: "도입한 AI 직원",
            value: purchases.length,
            sub: "구매 완료",
          },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-gray-200 bg-white p-5">
            <div className={`inline-flex rounded-lg p-2 mb-3 ${stat.bg}`}>
              {stat.icon}
            </div>
            <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
            <div className="text-sm font-medium text-gray-700 mt-0.5">{stat.label}</div>
            <div className="text-xs text-gray-400 mt-0.5">{stat.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* My workers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-lg">내 AI 직원</h2>
            <Link href="/studio" className="text-sm text-indigo-600 hover:underline">
              전체 보기
            </Link>
          </div>
          {myWorkers.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500 text-sm">아직 만든 AI 직원이 없습니다</p>
              <Link href="/studio/create" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                만들러 가기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {myWorkers.slice(0, 5).map((worker) => {
                const statusInfo = WORKER_STATUSES[worker.status as keyof typeof WORKER_STATUSES];
                return (
                  <div key={worker.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg shrink-0">
                      🤖
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">{worker.title}</span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                          {statusInfo?.label}
                        </span>
                      </div>
                      <div className="text-xs text-gray-400">
                        {worker.totalSales}명 도입 · {formatDate(worker.createdAt)}
                      </div>
                    </div>
                    {worker.status === "published" && (
                      <div className="flex items-center gap-1 text-sm">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-gray-600 text-xs">{worker.avgRating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Purchased workers */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 text-lg">도입한 AI 직원</h2>
          </div>
          {purchases.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center">
              <p className="text-gray-500 text-sm">아직 도입한 AI 직원이 없습니다</p>
              <Link href="/market" className="mt-2 inline-block text-sm text-indigo-600 hover:underline">
                마켓 둘러보기 →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {purchases.slice(0, 5).map((purchase) => (
                <Link
                  key={purchase.id}
                  href={`/market/${purchase.worker.id}`}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 hover:border-indigo-200 hover:shadow-sm transition-all"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-lg shrink-0">
                    🤖
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 truncate">{purchase.worker.title}</p>
                    <div className="text-xs text-gray-400">
                      {getCategoryLabel(purchase.worker.category)} · {formatDate(purchase.createdAt)}
                    </div>
                  </div>
                  <span className="text-xs text-emerald-600 font-medium shrink-0">
                    {formatPrice(purchase.amount)}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
