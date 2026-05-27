export const dynamic = "force-dynamic";

import Link from "next/link";
import { BrainCircuit, Zap, Shield, TrendingUp, ArrowRight, Star, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/db";

async function getStats() {
  const [workerCount, purchaseCount] = await Promise.all([
    db.aIWorker.count({ where: { status: "published" } }),
    db.purchase.count({ where: { paymentStatus: "completed" } }),
  ]);
  return { workerCount, purchaseCount };
}

const FEATURED_CATEGORIES = [
  { icon: "📣", label: "마케팅", value: "marketing", desc: "카피라이팅, SNS 콘텐츠" },
  { icon: "⚖️", label: "법무", value: "legal", desc: "계약서 검토, 법률 요약" },
  { icon: "💰", label: "회계", value: "accounting", desc: "세무 문서, 비용 정리" },
  { icon: "🎧", label: "고객지원", value: "customer_support", desc: "문의 응대, FAQ 생성" },
  { icon: "💻", label: "개발", value: "development", desc: "코드 리뷰, 문서 생성" },
  { icon: "📊", label: "데이터", value: "data", desc: "데이터 분석, 리포트" },
];

export default async function HomePage() {
  const stats = await getStats();

  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-indigo-900 to-purple-900 py-24 text-white">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-400/10 px-4 py-1.5 text-sm text-indigo-200 mb-8">
            <Zap className="h-3.5 w-3.5" />
            전문가 노하우를 AI 직원으로
          </div>
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            <span className="block">AI 직원을 만들고</span>
            <span className="block text-indigo-300">판매하세요</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-indigo-200 leading-relaxed">
            당신의 업무 노하우와 전문 지식을 AI 직원으로 상품화하세요.
            기업은 필요한 AI 직원을 바로 도입해 업무를 자동화할 수 있습니다.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/market">
              <Button size="xl" className="bg-white text-indigo-900 hover:bg-indigo-50 font-semibold">
                AI 직원 둘러보기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                메이커로 시작하기
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid grid-cols-3 gap-8 max-w-sm mx-auto sm:max-w-md">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.workerCount}+</div>
              <div className="text-sm text-indigo-300 mt-1">등록 AI 직원</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.purchaseCount}+</div>
              <div className="text-sm text-indigo-300 mt-1">누적 도입</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">80%</div>
              <div className="text-sm text-indigo-300 mt-1">메이커 수익</div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">카테고리별 AI 직원</h2>
            <p className="mt-3 text-gray-500">다양한 업무 영역의 전문 AI 직원을 찾아보세요</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {FEATURED_CATEGORIES.map((cat) => (
              <Link
                key={cat.value}
                href={`/market?category=${cat.value}`}
                className="group flex flex-col items-center rounded-xl border border-gray-200 p-5 text-center transition-all hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <span className="text-3xl mb-3">{cat.icon}</span>
                <span className="font-semibold text-gray-900 text-sm">{cat.label}</span>
                <span className="text-xs text-gray-500 mt-1">{cat.desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">어떻게 작동하나요?</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-16">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700 mb-6">
                <Users className="h-4 w-4" />
                메이커
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "AI 직원 제작", desc: "역할, 업무 플로우, 프롬프트를 설정해 AI 직원을 만드세요" },
                  { step: "02", title: "테스트 & 검수 요청", desc: "직접 테스트 후 플랫폼에 검수를 요청합니다" },
                  { step: "03", title: "마켓 등록 & 판매", desc: "승인 후 마켓에 등록되어 수익을 창출하세요" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white font-bold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700 mb-6">
                <Package className="h-4 w-4" />
                구매자
              </div>
              <div className="space-y-6">
                {[
                  { step: "01", title: "AI 직원 검색", desc: "카테고리별로 원하는 업무를 수행하는 AI 직원을 찾으세요" },
                  { step: "02", title: "체험 & 구매", desc: "무료 체험 후 마음에 들면 구매해 도입하세요" },
                  { step: "03", title: "즉시 업무 자동화", desc: "바로 실행해 반복 업무를 AI에게 맡기세요" },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold text-sm">
                      {item.step}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.title}</h3>
                      <p className="text-sm text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">플랫폼 특징</h2>
          </div>
          <div className="grid gap-8 sm:grid-cols-3">
            {[
              {
                icon: <BrainCircuit className="h-7 w-7 text-indigo-600" />,
                title: "전문가 품질 보증",
                desc: "모든 AI 직원은 플랫폼의 엄격한 검수를 통과한 고품질 제품입니다.",
              },
              {
                icon: <Shield className="h-7 w-7 text-emerald-600" />,
                title: "안전한 거래",
                desc: "Stripe 결제로 안전하게 구매하고, 메이커에게는 투명하게 정산됩니다.",
              },
              {
                icon: <TrendingUp className="h-7 w-7 text-purple-600" />,
                title: "80% 메이커 수익",
                desc: "판매 금액의 80%가 메이커에게 지급됩니다. 전문 지식을 수익으로.",
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-xl border border-gray-200 p-6">
                <div className="mb-4 w-fit rounded-lg bg-gray-50 p-3">{feature.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-indigo-600">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white">지금 시작하세요</h2>
          <p className="mt-4 text-lg text-indigo-200">
            메이커로 등록해 당신의 전문 지식을 AI 직원으로 상품화하거나,
            필요한 AI 직원을 마켓에서 찾아보세요.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link href="/register">
              <Button size="xl" className="bg-white text-indigo-600 hover:bg-indigo-50 font-semibold">
                무료로 시작하기
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link href="/market">
              <Button size="xl" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                마켓 둘러보기
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
