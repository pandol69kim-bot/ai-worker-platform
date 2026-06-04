"use client";

import { useState } from "react";
import { Play, Loader2, Copy, CheckCheck, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface WorkerExecutorProps {
  workerId: string;
  canUse: boolean;
  isFree: boolean;
  canInspectPrompt?: boolean;
}

export function WorkerExecutor({ workerId, canUse, isFree, canInspectPrompt = false }: WorkerExecutorProps) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ tokens?: number; duration?: number } | null>(null);
  const [actualPrompt, setActualPrompt] = useState("");
  const [showPrompt, setShowPrompt] = useState(false);

  async function handleExecute() {
    if (!input.trim()) return;
    setError("");
    setOutput("");
    setStats(null);
    setActualPrompt("");
    setShowPrompt(false);
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
      setActualPrompt(typeof data.actualPrompt === "string" ? data.actualPrompt : "");
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
        <label className="worker-executor-label mb-1.5 block text-sm font-medium text-gray-700">
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
          className="worker-executor-input bg-white"
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
        <div className="worker-executor-error rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {output && (
        <div className="worker-executor-result rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="worker-executor-result-title text-sm font-medium text-gray-700">실행 결과</span>
            <button
              onClick={handleCopy}
              className="worker-executor-copy flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              {copied ? <CheckCheck className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "복사됨" : "복사"}
            </button>
          </div>
          <pre className="worker-executor-output whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {output}
          </pre>
          {stats && (
            <div className="worker-executor-stats mt-3 flex gap-4 border-t border-gray-100 pt-2 text-xs text-gray-400">
              {stats.tokens && <span>{stats.tokens} 토큰 사용</span>}
              {stats.duration && <span>{(stats.duration / 1000).toFixed(1)}초</span>}
            </div>
          )}

          {canInspectPrompt && actualPrompt && (
            <div className="mt-3 border-t border-gray-100 pt-3">
              <button
                type="button"
                onClick={() => setShowPrompt((currentValue) => !currentValue)}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
              >
                {showPrompt ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                {showPrompt ? "실행 프롬프트 감추기" : "실행 프롬프트 보기"}
              </button>

              {showPrompt && (
                <pre className="mt-3 whitespace-pre-wrap rounded-lg bg-slate-900 px-3 py-3 text-xs leading-relaxed text-slate-100">
                  {actualPrompt}
                </pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
