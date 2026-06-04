"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AdminAiConfigVisibilityToggleProps {
  workerId: string;
  isAiConfigPublic: boolean;
}

export function AdminAiConfigVisibilityToggle({
  workerId,
  isAiConfigPublic,
}: AdminAiConfigVisibilityToggleProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/workers/${workerId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAiConfigPublic: !isAiConfigPublic }),
      });

      if (response.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" disabled={loading} onClick={handleToggle}>
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isAiConfigPublic ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      {isAiConfigPublic ? "AI 정보 숨김" : "AI 정보 공개"}
    </Button>
  );
}