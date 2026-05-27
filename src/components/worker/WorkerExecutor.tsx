"use client";

import { useState } from "react";
import { Play, Loader2, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface WorkerExecutorProps {
  workerId: string;
  canUse: boolean;
  isFree: boolean;
}

export function WorkerExecutor({ workerId, canUse, isFree }: WorkerExecutorProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ tokens?: number; duration?: number } | null>(null);

  async function handleExecute() {
    if (!input.trim()) return;
    setError("");
    setOutput("");
    setStats(null);
    setLoading(true);

    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId, input }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "실행 중 오류가 발생했습니다.");
        return;
      }

      setOutput(data.output);
      setStats({ tokens: data.tokens, duration: data.duration });
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium text-gray-700 mb-1.5 block">
          업무 요청 내용 입력
        </label>
        <Textarea
          placeholder={
            isFree || canUse
              ? "AI 직원에게 처리할 업무를 입력하세요..."
              : "구매 후 사용 가능합니다. 체험을 원하시면 아래 버튼을 클릭하세요."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={4}
          className="bg-white"
          disabled={!canUse && !isFree}
        />
      </div>

      <Button
        onClick={handleExecute}
        disabled={loading || !input.trim() || (!canUse && !isFree)}
        className="w-full"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            AI 직원 작업 중...
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            실행하기
          </>
        )}
      </Button>

      {error && (
        <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {output && (
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">실행 결과</span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {output}
          </pre>
          {stats && (
            <div className="mt-3 flex gap-4 text-xs text-gray-400 border-t border-gray-100 pt-2">
              {stats.tokens && <span>{stats.tokens} 토큰 사용</span>}
              {stats.duration && <span>{(stats.duration / 1000).toFixed(1)}초</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
