export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CategoryThumbnail } from "@/components/worker/CategoryThumbnail";
import { PlusCircle, Edit, Send, Trash2, Eye } from "lucide-react";
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">제작 센터</h1>
          <p className="text-gray-500 mt-1">AI 직원을 만들고 관리하세요</p>
        </div>
        <Link href="/studio/create">
          <Button className="gap-2">
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
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 hover:shadow-sm transition-shadow"
              >
                <CategoryThumbnail category={worker.category} className="h-12 w-12 shrink-0" compact />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <h3 className="font-semibold text-gray-900 truncate">{worker.title}</h3>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo?.color ?? "bg-gray-100 text-gray-700"}`}>
                      {statusInfo?.label ?? worker.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{worker.description}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
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
                <WorkerActions worker={worker} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
