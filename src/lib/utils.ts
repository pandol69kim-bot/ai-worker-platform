import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  if (price === 0) return "무료";
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
  }).format(price);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export const CATEGORY_PRESETS = [
  {
    value: "marketing",
    label: "마케팅",
    icon: "📣",
    description: "카피라이팅, SNS 콘텐츠",
    thumbnailClass: "bg-gradient-to-br from-rose-100 via-orange-50 to-amber-100",
  },
  {
    value: "sales",
    label: "세일즈",
    icon: "🤝",
    description: "세일즈 스크립트, 고객 설득",
    thumbnailClass: "bg-gradient-to-br from-cyan-100 via-sky-50 to-blue-100",
  },
  {
    value: "hr",
    label: "HR",
    icon: "🧑‍💼",
    description: "채용, 평가, 조직 운영",
    thumbnailClass: "bg-gradient-to-br from-fuchsia-100 via-pink-50 to-rose-100",
  },
  {
    value: "accounting",
    label: "회계",
    icon: "💰",
    description: "세무 문서, 비용 정리",
    thumbnailClass: "bg-gradient-to-br from-amber-100 via-yellow-50 to-lime-100",
  },
  {
    value: "legal",
    label: "법무",
    icon: "⚖️",
    description: "계약서 검토, 법률 요약",
    thumbnailClass: "bg-gradient-to-br from-slate-200 via-zinc-100 to-stone-200",
  },
  {
    value: "customer_support",
    label: "고객지원",
    icon: "🎧",
    description: "문의 응대, FAQ 생성",
    thumbnailClass: "bg-gradient-to-br from-emerald-100 via-teal-50 to-cyan-100",
  },
  {
    value: "development",
    label: "개발",
    icon: "💻",
    description: "코드 리뷰, 문서 생성",
    thumbnailClass: "bg-gradient-to-br from-indigo-100 via-blue-50 to-violet-100",
  },
  {
    value: "design",
    label: "디자인",
    icon: "🎨",
    description: "UI, 브랜드, 그래픽",
    thumbnailClass: "bg-gradient-to-br from-pink-100 via-violet-50 to-purple-100",
  },
  {
    value: "data",
    label: "데이터",
    icon: "📊",
    description: "데이터 분석, 리포트",
    thumbnailClass: "bg-gradient-to-br from-blue-100 via-cyan-50 to-indigo-100",
  },
  {
    value: "other",
    label: "기타",
    icon: "🧩",
    description: "특수 업무, 맞춤형 자동화",
    thumbnailClass: "bg-gradient-to-br from-neutral-200 via-neutral-50 to-stone-200",
  },
] as const;

export const CATEGORIES = CATEGORY_PRESETS.map(({ value, label }) => ({ value, label }));

const FALLBACK_CATEGORY_THUMBNAILS = [
  "bg-gradient-to-br from-sky-100 via-white to-indigo-100",
  "bg-gradient-to-br from-emerald-100 via-white to-cyan-100",
  "bg-gradient-to-br from-amber-100 via-white to-rose-100",
  "bg-gradient-to-br from-violet-100 via-white to-fuchsia-100",
  "bg-gradient-to-br from-slate-200 via-white to-zinc-100",
] as const;

export const WORKER_STATUSES = {
  draft: { label: "초안", color: "bg-gray-100 text-gray-700" },
  submitted: { label: "검토 요청", color: "bg-yellow-100 text-yellow-700" },
  reviewing: { label: "검토 중", color: "bg-blue-100 text-blue-700" },
  approved: { label: "승인됨", color: "bg-green-100 text-green-700" },
  rejected: { label: "반려", color: "bg-red-100 text-red-700" },
  published: { label: "게시됨", color: "bg-emerald-100 text-emerald-700" },
} as const;

export function normalizeCategoryInput(value: string): string {
  const normalized = value.trim().replace(/\s+/g, " ");
  if (!normalized) return "";

  const presetByValue = CATEGORY_PRESETS.find((category) => category.value === normalized);
  if (presetByValue) return presetByValue.value;

  const presetByLabel = CATEGORY_PRESETS.find((category) => category.label === normalized);
  if (presetByLabel) return presetByLabel.value;

  return normalized;
}

export function isPresetCategory(value: string): boolean {
  const normalized = normalizeCategoryInput(value);
  return CATEGORY_PRESETS.some((category) => category.value === normalized);
}

export function getCategoryLabel(value: string): string {
  const normalized = normalizeCategoryInput(value);
  const category = CATEGORY_PRESETS.find((item) => item.value === normalized);
  if (category) return category.label;

  return normalized.replace(/[_-]+/g, " ");
}

function getStableThumbnailIndex(value: string): number {
  const normalized = normalizeCategoryInput(value);
  let hash = 0;

  for (const char of normalized) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return hash % FALLBACK_CATEGORY_THUMBNAILS.length;
}

export function getCategoryVisual(value: string) {
  const normalized = normalizeCategoryInput(value);
  const preset = CATEGORY_PRESETS.find((category) => category.value === normalized);

  if (preset) {
    return preset;
  }

  const label = getCategoryLabel(normalized || "other");
  const fallbackIcon = label.slice(0, 1) || "✨";

  return {
    value: normalized,
    label,
    icon: fallbackIcon,
    description: "사용자 정의 카테고리",
    thumbnailClass: FALLBACK_CATEGORY_THUMBNAILS[getStableThumbnailIndex(normalized || label)],
  };
}

export function getCategoryOptions(values: string[] = []) {
  const mergedValues = [
    ...CATEGORY_PRESETS.map((category) => category.value),
    ...values.map((value) => normalizeCategoryInput(value)).filter(Boolean),
  ];

  return mergedValues.filter((value, index) => mergedValues.indexOf(value) === index).map((value) => ({
    value,
    label: getCategoryLabel(value),
  }));
}
