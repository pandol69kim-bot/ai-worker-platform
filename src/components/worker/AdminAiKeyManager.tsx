"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Key, Loader2, Pencil, Trash2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AI_PROVIDER_OPTIONS, getAIProviderLabel } from "@/lib/ai/catalog";

type KeyRecord = {
  id: string;
  provider: string;
  apiKey: string;
  isActive: boolean;
  updatedAt: string;
};

type EditState = {
  provider: string;
  value: string;
};

const PROVIDER_ENV_MAP: Record<string, string> = {
  openai: "OPENAI_API_KEY",
  gemini: "GEMINI_API_KEY",
  claude: "ANTHROPIC_API_KEY",
};

export function AdminAiKeyManager({ envKeyStatus }: { envKeyStatus: Record<string, boolean> }) {
  const [keys, setKeys] = useState<KeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<EditState | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showKey, setShowKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  async function fetchKeys() {
    setLoading(true);
    const res = await fetch("/api/admin/ai-keys");
    if (res.ok) setKeys(await res.json());
    setLoading(false);
  }

  async function handleSave() {
    if (!edit || !edit.value.trim()) return;
    setSaving(true);
    const res = await fetch("/api/admin/ai-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider: edit.provider, apiKey: edit.value.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setKeys((prev) => {
        const exists = prev.find((k) => k.provider === updated.provider);
        return exists
          ? prev.map((k) => (k.provider === updated.provider ? updated : k))
          : [...prev, updated];
      });
    }
    setEdit(null);
    setSaving(false);
  }

  async function handleDelete(provider: string) {
    setDeleting(provider);
    await fetch("/api/admin/ai-keys", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ provider }),
    });
    setKeys((prev) => prev.filter((k) => k.provider !== provider));
    setDeleting(null);
  }

  function getKeyForProvider(provider: string) {
    return keys.find((k) => k.provider === provider);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {AI_PROVIDER_OPTIONS.map((p) => {
        const record = getKeyForProvider(p.value);
        const hasDbKey = !!record;
        const hasEnvKey = envKeyStatus[p.value] ?? false;
        const isEditing = edit?.provider === p.value;

        return (
          <div
            key={p.value}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50">
                  <Key className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">{getAIProviderLabel(p.value)}</div>
                  <div className="text-xs text-gray-400">{PROVIDER_ENV_MAP[p.value]}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {hasDbKey ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                    <Check className="h-3 w-3" /> DB 등록됨
                  </span>
                ) : hasEnvKey ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                    <Check className="h-3 w-3" /> ENV 사용 중
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    <X className="h-3 w-3" /> 미설정
                  </span>
                )}

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEdit({ provider: p.value, value: "" })}
                  className="h-7 px-2.5 text-xs"
                >
                  <Pencil className="mr-1 h-3 w-3" />
                  {hasDbKey ? "변경" : "등록"}
                </Button>

                {hasDbKey && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(p.value)}
                    disabled={deleting === p.value}
                    className="h-7 px-2.5 text-xs text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {deleting === p.value ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Trash2 className="h-3 w-3" />
                    )}
                  </Button>
                )}
              </div>
            </div>

            {hasDbKey && !isEditing && (
              <div className="mt-3 flex items-center gap-2">
                <code className="flex-1 rounded-md bg-gray-50 px-3 py-1.5 text-xs text-gray-600 font-mono">
                  {showKey === p.value ? record.apiKey : record.apiKey}
                </code>
                <button
                  onClick={() => setShowKey(showKey === p.value ? null : p.value)}
                  className="text-gray-400 hover:text-gray-600"
                  title={showKey === p.value ? "숨기기" : "표시"}
                >
                  {showKey === p.value ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <span className="text-xs text-gray-400">
                  {new Date(record.updatedAt).toLocaleDateString("ko-KR")} 업데이트
                </span>
              </div>
            )}

            {isEditing && (
              <div className="mt-3 flex gap-2">
                <Input
                  type="password"
                  placeholder={`${getAIProviderLabel(p.value)} API 키 입력`}
                  value={edit.value}
                  onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                  className="flex-1 font-mono text-sm"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSave();
                    if (e.key === "Escape") setEdit(null);
                  }}
                />
                <Button size="sm" onClick={handleSave} disabled={saving || !edit.value.trim()}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "저장"}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEdit(null)}>
                  취소
                </Button>
              </div>
            )}
          </div>
        );
      })}

      <p className="text-xs text-gray-400 pt-1">
        DB에 등록된 키가 우선 사용됩니다. DB 키 삭제 시 환경 변수(ENV)로 자동 fallback됩니다.
      </p>
    </div>
  );
}
