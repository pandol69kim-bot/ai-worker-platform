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

export const CATEGORIES = [
  { value: "marketing", label: "마케팅" },
  { value: "sales", label: "세일즈" },
  { value: "hr", label: "HR" },
  { value: "accounting", label: "회계" },
  { value: "legal", label: "법무" },
  { value: "customer_support", label: "고객지원" },
  { value: "development", label: "개발" },
  { value: "design", label: "디자인" },
  { value: "data", label: "데이터" },
  { value: "other", label: "기타" },
] as const;

export const WORKER_STATUSES = {
  draft: { label: "초안", color: "bg-gray-100 text-gray-700" },
  submitted: { label: "검토 요청", color: "bg-yellow-100 text-yellow-700" },
  reviewing: { label: "검토 중", color: "bg-blue-100 text-blue-700" },
  approved: { label: "승인됨", color: "bg-green-100 text-green-700" },
  rejected: { label: "반려", color: "bg-red-100 text-red-700" },
  published: { label: "게시됨", color: "bg-emerald-100 text-emerald-700" },
} as const;

export function getCategoryLabel(value: string): string {
  const cat = CATEGORIES.find((c) => c.value === value);
  return cat?.label ?? value;
}
