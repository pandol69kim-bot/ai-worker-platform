export const dynamic = "force-dynamic";

import Link from "next/link";
import { Search, Star, TrendingUp, Package } from "lucide-react";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { CategoryThumbnail } from "@/components/worker/CategoryThumbnail";
import { formatPrice, getCategoryLabel, getCategoryMatchValues, getCategoryOptions } from "@/lib/utils";

interface SearchParams {
  category?: string;
  search?: string;
  sort?: string;
  page?: string;
}

async function getWorkers(params: SearchParams) {
  const where: Record<string, unknown> = { status: "published" };

  if (params.category) {
    const categoryValues = getCategoryMatchValues(params.category);
    if (categoryValues.length === 1) {
      where.category = categoryValues[0];
    } else if (categoryValues.length > 1) {
      where.category = { in: categoryValues };
    }
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search } },
      { description: { contains: params.search } },
    ];
  }

  const orderBy: Record<string, string> =
    params.sort === "popular"
      ? { totalSales: "desc" }
      : params.sort === "rating"
      ? { avgRating: "desc" }
      : { createdAt: "desc" };

  const page = parseInt(params.page ?? "1");
  const limit = 12;

  const [workers, total, categoryRows] = await Promise.all([
    db.aIWorker.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      include: {
        maker: { select: { name: true, image: true } },
      },
    }),
    db.aIWorker.count({ where }),
    db.aIWorker.findMany({
      where: { status: "published" },
      select: { category: true },
      distinct: ["category"],
      orderBy: { category: "asc" },
    }),
  ]);

  const categoryOptions = getCategoryOptions([
    ...categoryRows.map((row) => row.category),
    ...(params.category ? [params.category] : []),
  ]);

  return { workers, total, page, limit, categoryOptions };
}

export default async function MarketPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const { workers, total, categoryOptions } = await getWorkers(params);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI 직원 마켓</h1>
        <p className="mt-2 text-gray-500">검증된 AI 직원을 바로 도입해 업무를 자동화하세요</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form className="flex gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              name="search"
              defaultValue={params.search}
              placeholder="AI 직원 검색..."
              className="h-9 w-full rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="h-9 rounded-lg bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700"
          >
            검색
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <Link
            href="/market"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              !params.sort || params.sort === "latest"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            최신순
          </Link>
          <Link
            href="/market?sort=popular"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              params.sort === "popular"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5" /> 인기순
            </span>
          </Link>
          <Link
            href="/market?sort=rating"
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              params.sort === "rating"
                ? "bg-indigo-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center gap-1">
              <Star className="h-3.5 w-3.5" /> 평점순
            </span>
          </Link>
        </div>
      </div>

      {/* Category tabs */}
      <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
        <Link
          href="/market"
          className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            !params.category
              ? "bg-gray-900 text-white"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          전체
        </Link>
        {categoryOptions.map((cat) => (
          <Link
            key={cat.value}
            href={{ pathname: "/market", query: { category: cat.value } }}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              params.category === cat.value
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {workers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <Package className="h-12 w-12 text-gray-300 mb-4" />
          <h3 className="font-semibold text-gray-600">등록된 AI 직원이 없습니다</h3>
          <p className="text-sm text-gray-400 mt-1">첫 번째 AI 직원을 만들어보세요</p>
          <Link
            href="/studio"
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            만들러 가기
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-4 text-sm text-gray-500">총 {total}개의 AI 직원</p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {workers.map((worker) => (
              <Link
                key={worker.id}
                href={`/market/${worker.id}`}
                className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all hover:-translate-y-0.5"
              >
                <CategoryThumbnail category={worker.category} className="aspect-video" />
                <div className="p-4 flex flex-col flex-1">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-gray-900 line-clamp-2 text-sm leading-snug group-hover:text-indigo-600 transition-colors">
                      {worker.title}
                    </h3>
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {getCategoryLabel(worker.category)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 flex-1 mb-3">
                    {worker.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium text-gray-700">
                        {worker.avgRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-gray-400">({worker.reviewCount})</span>
                    </div>
                    <span className="text-sm font-bold text-indigo-600">
                      {formatPrice(worker.price)}
                    </span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    by {worker.maker.name ?? "익명"} · {worker.totalSales}명 도입
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
