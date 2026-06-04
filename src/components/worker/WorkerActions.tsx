"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Edit, Send, Trash2, Eye, Loader2 } from "lucide-react";

interface Worker {
  id: string;
  status: string;
  title: string;
}

export function WorkerActions({ worker }: { worker: Worker }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubmit() {
    setLoading("submit");
    try {
      const res = await fetch(`/api/workers/${worker.id}/submit`, { method: "POST" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`"${worker.title}"를 삭제하시겠습니까?`)) return;
    setLoading("delete");
    try {
      const res = await fetch(`/api/workers/${worker.id}`, { method: "DELETE" });
      if (res.ok) router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      {["approved", "published", "rejected"].includes(worker.status) && (
        <Link
          href={`/market/${worker.id}`}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
          title={worker.status === "published" ? "마켓에서 보기" : worker.status === "rejected" ? "작성자 테스트" : "미리보기 / 실행"}
        >
          <Eye className="h-4 w-4" />
        </Link>
      )}

      {["draft", "rejected"].includes(worker.status) && (
        <>
          <Link
            href={`/studio/workers/${worker.id}/edit`}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"
            title="편집"
          >
            <Edit className="h-4 w-4" />
          </Link>
          <button
            onClick={handleSubmit}
            disabled={loading === "submit"}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 text-xs font-medium text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
            title="검수 요청"
          >
            {loading === "submit" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            검수 요청
          </button>
          <button
            onClick={handleDelete}
            disabled={loading === "delete"}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 hover:bg-red-50 text-red-500 disabled:opacity-50"
            title="삭제"
          >
            {loading === "delete" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </>
      )}
    </div>
  );
}
