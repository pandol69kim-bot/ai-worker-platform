export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { Star, Users, Play, ArrowLeft, CheckCircle } from "lucide-react";
import {
  canViewAiConfig,
  getAIModelLabel,
  getAIProviderLabel,
} from "@/lib/ai/catalog";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";
import { formatPrice, formatDate, getCategoryLabel, WORKER_STATUSES } from "@/lib/utils";
import { CategoryThumbnail } from "@/components/worker/CategoryThumbnail";
import { WorkerExecutor } from "@/components/worker/WorkerExecutor";
import { PurchaseButton } from "@/components/worker/PurchaseButton";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkerDetailPage({ params }: PageProps) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  const isAdmin = user?.role === "admin";

  const worker = await db.aIWorker.findFirst({
    where: isAdmin
      ? { id }
      : user?.id
      ? {
          id,
          OR: [
            { status: "published" },
            { makerId: user.id },
          ],
        }
      : { id, status: "published" },
    include: {
      maker: {
        select: {
          id: true,
          name: true,
          image: true,
          makerProfile: { select: { bio: true, expertise: true } },
        },
      },
      reviews: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!worker) notFound();

  const hasPurchased = user?.id
    ? !!(await db.purchase.findFirst({
        where: { userId: user.id, workerId: id, paymentStatus: "completed" },
      }))
    : false;

  const isFree = worker.priceType === "free" || worker.price === 0;
  const isMaker = user?.id === worker.maker.id;
  const canUse = isFree || hasPurchased || isMaker || isAdmin;
  const isMakerOwnPreview = isMaker && worker.status !== "published";
  const isMakerRejectedPreview = isMaker && worker.status === "rejected";
  const showAiConfig = canViewAiConfig({
    userRole: user?.role,
    isMaker,
    isAiConfigPublic: worker.isAiConfigPublic,
  });

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/market" className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="h-4 w-4" />
        마켓으로 돌아가기
      </Link>

      {worker.status !== "published" && (isAdmin || isMakerOwnPreview) && (
        <div className={`mb-4 rounded-lg border px-4 py-2.5 text-sm ${
          isAdmin && !isMaker
            ? "bg-yellow-50 border-yellow-200 text-yellow-800"
            : worker.status === "draft"
            ? "bg-sky-50 border-sky-200 text-sky-800"
            : worker.status === "rejected"
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-indigo-50 border-indigo-200 text-indigo-800"
        }`}>
          <span className="font-medium">
            {isAdmin && !isMaker ? "관리자 미리보기" : "작성자 테스트 모드"}
          </span>
          {" · "}현재 상태:{" "}
          <span className="font-medium">
            {WORKER_STATUSES[worker.status as keyof typeof WORKER_STATUSES]?.label ?? worker.status}
          </span>
          {worker.status === "draft" && isMaker && (
            <span className="ml-2 text-sky-600">저장된 초안을 테스트할 수 있습니다.</span>
          )}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          <div>
            <div className="flex items-start gap-3 mb-4">
              <CategoryThumbnail category={worker.category} className="h-14 w-14 shrink-0 sm:h-16 sm:w-16" compact />
              <div className="min-w-0 flex-1">
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{worker.title}</h1>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mt-1.5">
                  <Badge variant="secondary">{getCategoryLabel(worker.category)}</Badge>
                  {showAiConfig && <Badge variant="info">{getAIProviderLabel(worker.aiProvider)}</Badge>}
                  {showAiConfig && <Badge variant="outline">{getAIModelLabel(worker.aiProvider, worker.aiModel)}</Badge>}
                  <div className="flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
                    <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 sm:h-4 sm:w-4" />
                    {worker.avgRating.toFixed(1)} ({worker.reviewCount}개 리뷰)
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500 sm:text-sm">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    {worker.totalSales}명 도입
                  </div>
                </div>
              </div>
            </div>
            <p className="text-gray-600 leading-relaxed">{worker.description}</p>
          </div>

          {/* Role definition */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">역할 정의</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{worker.roleDefinition}</p>
          </div>

          {/* Workflow */}
          <div className="rounded-xl border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-3">업무 플로우</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{worker.workflow}</p>
          </div>

          {worker.outputFormat && (
            <div className="rounded-xl border border-gray-200 p-5">
              <h2 className="font-semibold text-gray-900 mb-3">출력 형식</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{worker.outputFormat}</p>
            </div>
          )}

          {/* Executor */}
          <div className="worker-executor-shell rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Play className="worker-executor-icon h-5 w-5 text-indigo-600" />
              <h2 className="worker-executor-heading font-semibold text-gray-900">
                {canUse ? "AI 직원 실행" : "체험하기"}
              </h2>
            </div>
            {isMakerOwnPreview && (
              <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                worker.status === "draft"
                  ? "bg-sky-50 text-sky-700"
                  : worker.status === "rejected"
                  ? "bg-amber-50 text-amber-700"
                  : "bg-indigo-50 text-indigo-700"
              }`}>
                {worker.status === "draft" && "초안 상태입니다. 제출 전에 작성자 전용으로 테스트할 수 있습니다."}
                {worker.status === "submitted" && "검수 대기 중입니다. 작성자 전용으로 테스트할 수 있습니다."}
                {worker.status === "reviewing" && "검토 중입니다. 작성자 전용으로 테스트할 수 있습니다."}
                {worker.status === "approved" && "승인된 AI 직원입니다. 게시 전 작성자 전용으로 테스트할 수 있습니다."}
                {worker.status === "rejected" && "반려된 AI 직원입니다. 수정 저장 후 재검수 전에 직접 실행해 볼 수 있습니다."}
              </div>
            )}
            <WorkerExecutor
              workerId={worker.id}
              canUse={canUse}
              isFree={isFree}
              canInspectPrompt={user?.role === "admin"}
            />
          </div>

          {/* Reviews */}
          {worker.reviews.length > 0 && (
            <div>
              <h2 className="font-semibold text-gray-900 mb-4">사용자 리뷰</h2>
              <div className="space-y-3">
                {worker.reviews.map((review) => (
                  <div key={review.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm text-gray-900">{review.user.name}</span>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-gray-600">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{formatDate(review.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Purchase card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 sticky top-20">
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {formatPrice(worker.price)}
            </div>
            {worker.priceType === "subscription" && (
              <p className="text-sm text-gray-500 mb-3">/ 월</p>
            )}

            {isMaker ? (
              <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-700 mb-4">
                <CheckCircle className="h-4 w-4" />
                {isMakerRejectedPreview
                  ? "본인이 제작한 반려 AI 직원입니다. 작성자 전용으로 테스트할 수 있습니다."
                  : "본인이 제작한 AI 직원입니다. 바로 실행할 수 있습니다."}
              </div>
            ) : hasPurchased ? (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700 mb-4">
                <CheckCircle className="h-4 w-4" />
                도입 완료
              </div>
            ) : (
              <PurchaseButton
                workerId={worker.id}
                price={worker.price}
                isFree={isFree}
                isLoggedIn={!!user}
              />
            )}

            <div className="mt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span className="text-gray-500">버전</span>
                <span>{worker.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">카테고리</span>
                <span>{getCategoryLabel(worker.category)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">등록일</span>
                <span>{formatDate(worker.publishedAt ?? worker.createdAt)}</span>
              </div>
              {showAiConfig && (
                <>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">AI 제공자</span>
                    <span className="text-right">{getAIProviderLabel(worker.aiProvider)}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-gray-500">AI 모델</span>
                    <span className="text-right">{getAIModelLabel(worker.aiProvider, worker.aiModel)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Maker card */}
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h3 className="font-semibold text-gray-900 mb-3">메이커 정보</h3>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {worker.maker.name?.[0] ?? "?"}
              </div>
              <div>
                <p className="font-medium text-sm text-gray-900">{worker.maker.name}</p>
                {worker.maker.makerProfile?.expertise && (
                  <p className="text-xs text-gray-500">{worker.maker.makerProfile.expertise}</p>
                )}
              </div>
            </div>
            {worker.maker.makerProfile?.bio && (
              <p className="mt-3 text-sm text-gray-600">{worker.maker.makerProfile.bio}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
