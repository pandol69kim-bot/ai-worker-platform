"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, XCircle, Globe, Loader2, ChevronDown, Clock } from "lucide-react";

interface AdminWorkerActionsProps {
  workerId: string;
  currentStatus: string;
}

export function AdminWorkerActions({ workerId, currentStatus }: AdminWorkerActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  async function handleAction(action: "review" | "approve" | "reject" | "publish") {
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/workers/${workerId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: note || undefined }),
      });

      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2">
        {currentStatus === "submitted" && (
          <>
            <button
              onClick={() => handleAction("review")}
              disabled={!!loading}
              className="flex items-center gap-1.5 rounded-lg bg-sky-50 border border-sky-200 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-100 disabled:opacity-50"
            >
              {loading === "review" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              검토 중
            </button>
            <button
              onClick={() => handleAction("approve")}
              disabled={!!loading}
              className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
              승인
            </button>
          </>
        )}

        {currentStatus === "reviewing" && (
          <button
            onClick={() => handleAction("approve")}
            disabled={!!loading}
            className="flex items-center gap-1.5 rounded-lg bg-blue-50 border border-blue-200 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
          >
            {loading === "approve" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" />}
            승인
          </button>
        )}

        {currentStatus === "approved" && (
          <button
            onClick={() => handleAction("publish")}
            disabled={!!loading}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-50"
          >
            {loading === "publish" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
            게시
          </button>
        )}

        <button
          onClick={() => setShowNote(!showNote)}
          className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-100"
        >
          <XCircle className="h-4 w-4" />
          반려
          <ChevronDown className={`h-3 w-3 transition-transform ${showNote ? "rotate-180" : ""}`} />
        </button>
      </div>

      {showNote && (
        <div className="flex gap-2 w-full max-w-xs">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="반려 사유 (선택)"
            className="flex-1 h-8 rounded-lg border border-gray-300 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <button
            onClick={() => handleAction("reject")}
            disabled={!!loading}
            className="h-8 rounded-lg bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading === "reject" ? <Loader2 className="h-4 w-4 animate-spin" /> : "반려"}
          </button>
        </div>
      )}
    </div>
  );
}
