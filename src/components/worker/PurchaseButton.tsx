"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShoppingCart, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";

interface PurchaseButtonProps {
  workerId: string;
  price: number;
  isFree: boolean;
  isLoggedIn: boolean;
}

export function PurchaseButton({ workerId, price, isFree, isLoggedIn }: PurchaseButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isLoggedIn) {
    return (
      <Link href="/login" className="block w-full">
        <Button variant="outline" className="w-full gap-2">
          <LogIn className="h-4 w-4" />
          로그인 후 {isFree ? "무료 도입" : "구매"}
        </Button>
      </Link>
    );
  }

  async function handlePurchase() {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workerId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "구매 처리 중 오류가 발생했습니다.");
        return;
      }

      if (data.clientSecret) {
        router.push(`/checkout?client_secret=${data.clientSecret}&purchase_id=${data.purchaseId}`);
      } else {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button
        onClick={handlePurchase}
        disabled={loading}
        className="w-full gap-2 mb-3"
        size="lg"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <ShoppingCart className="h-4 w-4" />
        )}
        {isFree ? "무료로 도입하기" : `${formatPrice(price)} 구매하기`}
      </Button>
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
