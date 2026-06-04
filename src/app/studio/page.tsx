export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { CategoryThumbnail } from "@/components/worker/CategoryThumbnail";
import { PlusCircle } from "lucide-react";
import { getCategoryLabel, WORKER_STATUSES } from "@/lib/utils";
import { formatDate } from "@/lib/utils";
import { WorkerActions } from "@/components/worker/WorkerActions";

export default async function StudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = session.user as { id: string };

  const workers = await db.aIWorker.findMany({
    where: { makerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">제작 센터</h1>
          <p className="text-gray-500 mt-1">AI 직원을 만들고 관리하세요</p>
        </div>
        <Link href="/studio/create" className="w-full sm:w-auto">
          <Button className="w-full gap-2 sm:w-auto">
            <PlusCircle className="h-4 w-4" />
            새 AI 직원 만들기
          </Button>
        </Link>
      </div>

      {workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 py-20 text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h3 className="font-semibold text-gray-700 text-lg">아직 만든 AI 직원이 없습니다</h3>
          <p className="text-gray-500 mt-2 mb-6">첫 번째 AI 직원을 만들어 업무 노하우를 상품화하세요</p>
          <Link href="/studio/create">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              첫 AI 직원 만들기
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {workers.map((worker) => {
            const statusInfo = WORKER_STATUSES[worker.status as keyof typeof WORKER_STATUSES];
            return (
              <div
                key={worker.id}
                className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-sm sm:flex-row sm:items-start"
              >
                <div className="flex items-start gap-3 sm:flex-1 sm:items-center sm:gap-4">
                  <CategoryThumbnail category={worker.category} className="h-12 w-12 shrink-0" compact />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <h3 className="min-w-0 wrap-break-word leading-tight font-semibold text-gray-900">{worker.title}</h3>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                        {statusInfo?.label ?? worker.status}
                      </span>
                    </div>
                    <p className="wrap-break-word text-sm text-gray-500 sm:line-clamp-2">{worker.description}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-400">
                      <span>{getCategoryLabel(worker.category)}</span>
                      <span>·</span>
                      <span>{formatDate(worker.createdAt)}</span>
                      {worker.status === "published" && (
                        <>
                          <span>·</span>
                          <span>{worker.totalSales}명 도입</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="sm:ml-auto">
                  <WorkerActions worker={worker} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
