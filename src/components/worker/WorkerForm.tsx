"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CATEGORIES } from "@/lib/utils";

interface WorkerFormProps {
  initialData?: {
    id: string;
    title: string;
    description: string;
    category: string;
    roleDefinition: string;
    workflow: string;
    prompt: string;
    rules?: string | null;
    outputFormat?: string | null;
    price: number;
    priceType: string;
    tags?: string | null;
  };
}

export function WorkerForm({ initialData }: WorkerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    title: initialData?.title ?? "",
    description: initialData?.description ?? "",
    category: initialData?.category ?? "",
    roleDefinition: initialData?.roleDefinition ?? "",
    workflow: initialData?.workflow ?? "",
    prompt: initialData?.prompt ?? "",
    rules: initialData?.rules ?? "",
    outputFormat: initialData?.outputFormat ?? "",
    price: initialData?.price ?? 0,
    priceType: initialData?.priceType ?? "free",
    tags: initialData?.tags ?? "",
  });

  function handleChange(field: string, value: string | number) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const url = initialData ? `/api/workers/${initialData.id}` : "/api/workers";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          price: Number(form.price),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "저장에 실패했습니다.");
        return;
      }

      router.push("/studio");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  const FIELD_HELP = {
    roleDefinition: "이 AI 직원이 어떤 역할을 하는지 명확하게 정의하세요. (예: 당신은 마케팅 전문가로서 고객의 상품을 효과적으로 홍보하는 카피라이팅을 담당합니다.)",
    workflow: "업무 처리 순서와 방법을 단계별로 작성하세요. (예: 1. 상품 정보 파악 → 2. 타겟 고객 분석 → 3. 카피 생성 → 4. 최종 검토)",
    prompt: "AI가 실제로 사용할 시스템 프롬프트를 작성하세요. 역할, 톤, 규칙 등을 포함하세요.",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic info */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">기본 정보</h2>

        <div className="space-y-1.5">
          <Label htmlFor="title">AI 직원 이름 *</Label>
          <Input
            id="title"
            placeholder="예: 마케팅 카피 작성 전문가"
            value={form.title}
            onChange={(e) => handleChange("title", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="category">카테고리 *</Label>
            <Select value={form.category} onValueChange={(v) => handleChange("category", v)}>
              <SelectTrigger>
                <SelectValue placeholder="카테고리 선택" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="priceType">가격 유형 *</Label>
            <Select value={form.priceType} onValueChange={(v) => handleChange("priceType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">무료</SelectItem>
                <SelectItem value="one_time">1회 구매</SelectItem>
                <SelectItem value="subscription">월 구독</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {form.priceType !== "free" && (
          <div className="space-y-1.5">
            <Label htmlFor="price">가격 (원)</Label>
            <Input
              id="price"
              type="number"
              min={0}
              step={1000}
              placeholder="예: 9900"
              value={form.price}
              onChange={(e) => handleChange("price", e.target.value)}
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="description">설명 *</Label>
          <Textarea
            id="description"
            placeholder="이 AI 직원이 어떤 업무를 처리하는지 구체적으로 설명하세요"
            value={form.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tags">태그 (쉼표로 구분)</Label>
          <Input
            id="tags"
            placeholder="예: 마케팅, 카피라이팅, SNS"
            value={form.tags}
            onChange={(e) => handleChange("tags", e.target.value)}
          />
        </div>
      </div>

      {/* Core settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">핵심 설정</h2>

        {(["roleDefinition", "workflow", "prompt"] as const).map((field) => (
          <div key={field} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label htmlFor={field}>
                {field === "roleDefinition" ? "역할 정의" : field === "workflow" ? "업무 플로우" : "시스템 프롬프트"} *
              </Label>
              <div className="group relative">
                <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
                <div className="absolute left-5 top-0 z-10 hidden w-64 rounded-lg border border-gray-200 bg-white p-2.5 text-xs text-gray-600 shadow-lg group-hover:block">
                  {FIELD_HELP[field]}
                </div>
              </div>
            </div>
            <Textarea
              id={field}
              placeholder={FIELD_HELP[field]}
              value={form[field]}
              onChange={(e) => handleChange(field, e.target.value)}
              rows={field === "prompt" ? 6 : 4}
              required
            />
          </div>
        ))}
      </div>

      {/* Advanced settings */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">추가 설정 (선택)</h2>

        <div className="space-y-1.5">
          <Label htmlFor="rules">규칙 및 제약사항</Label>
          <Textarea
            id="rules"
            placeholder="AI 직원이 반드시 지켜야 할 규칙을 작성하세요 (예: 반드시 한국어로만 답변, 법적 자문은 제공하지 않음)"
            value={form.rules}
            onChange={(e) => handleChange("rules", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="outputFormat">출력 형식</Label>
          <Textarea
            id="outputFormat"
            placeholder="결과물의 형식을 지정하세요 (예: 마크다운 형식, 번호 목록, 표 형식)"
            value={form.outputFormat}
            onChange={(e) => handleChange("outputFormat", e.target.value)}
            rows={2}
          />
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={loading} className="flex-1">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {initialData ? "수정 저장" : "저장하기"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/studio")}
        >
          취소
        </Button>
      </div>
    </form>
  );
}
