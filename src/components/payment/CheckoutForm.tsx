"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadStripe,
  type Stripe,
  type StripeElements,
  type StripePaymentElement,
} from "@stripe/stripe-js";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function CheckoutForm({ clientSecret, purchaseId }: { clientSecret: string; purchaseId?: string }) {
  const router = useRouter();
  const paymentElementContainerRef = useRef<HTMLDivElement | null>(null);
  const stripeRef = useRef<Stripe | null>(null);
  const elementsRef = useRef<StripeElements | null>(null);
  const paymentElementRef = useRef<StripePaymentElement | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isReady, setIsReady] = useState(false);

  function getReturnUrl() {
    const baseUrl = typeof window === "undefined"
      ? (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000")
      : window.location.origin;

    return `${baseUrl}/dashboard${purchaseId ? `?purchase_id=${purchaseId}` : ""}`;
  }

  useEffect(() => {
    let isMounted = true;

    async function setupPaymentElement() {
      if (!stripePromise || !paymentElementContainerRef.current) {
        return;
      }

      const stripe = await stripePromise;

      if (!stripe || !isMounted || !paymentElementContainerRef.current) {
        return;
      }

      stripeRef.current = stripe;
      const elements = stripe.elements({
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary: "#4f46e5",
            borderRadius: "12px",
          },
        },
      });

      const paymentElement = elements.create("payment");
      paymentElement.on("ready", () => {
        if (!isMounted) {
          return;
        }

        setError("");
        setIsReady(true);
      });
      paymentElement.on("loaderror", ({ error: loadError }) => {
        if (!isMounted) {
          return;
        }

        setIsReady(false);
        setError(loadError.message ?? "결제 정보를 불러오지 못했습니다.");
      });
      paymentElement.mount(paymentElementContainerRef.current);

      elementsRef.current = elements;
      paymentElementRef.current = paymentElement;
    }

    void setupPaymentElement();

    return () => {
      isMounted = false;
      setIsReady(false);
      paymentElementRef.current?.destroy();
      paymentElementRef.current = null;
      elementsRef.current = null;
    };
  }, [clientSecret]);

  if (!stripePromise) {
    return (
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>결제 설정 필요</CardTitle>
          <CardDescription>NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY가 설정되지 않았습니다.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!stripeRef.current || !elementsRef.current) {
      setError("결제 화면이 아직 준비되지 않았습니다.");
      return;
    }

    if (!isReady) {
      setError("결제 정보가 아직 준비되지 않았습니다. 잠시 후 다시 시도해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const result = await stripeRef.current.confirmPayment({
      elements: elementsRef.current,
      confirmParams: {
        return_url: getReturnUrl(),
      },
      redirect: "if_required",
    });

    if (result.error) {
      setError(result.error.message ?? "결제 처리 중 오류가 발생했습니다.");
      setIsSubmitting(false);
      return;
    }

    router.push(`/dashboard${purchaseId ? `?purchase_id=${purchaseId}` : ""}`);
    router.refresh();
  }

  return (
    <Card className="w-full max-w-xl">
      <CardHeader>
        <CardTitle>결제하기</CardTitle>
        <CardDescription>안전한 Stripe 결제로 AI 직원을 도입합니다.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div ref={paymentElementContainerRef} />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button type="submit" size="lg" className="w-full" disabled={!isReady || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                결제 처리 중...
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" />
                결제 완료하기
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}