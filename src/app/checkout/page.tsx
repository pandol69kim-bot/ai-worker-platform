import { redirect } from "next/navigation";
import { CheckoutForm } from "@/components/payment/CheckoutForm";

interface CheckoutPageProps {
  searchParams: Promise<{
    client_secret?: string;
    purchase_id?: string;
  }>;
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  const clientSecret = params.client_secret;
  const purchaseId = params.purchase_id;

  if (!clientSecret) {
    redirect("/market");
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 w-full max-w-xl text-center">
        <h1 className="text-3xl font-bold text-gray-900">결제 페이지</h1>
        <p className="mt-2 text-sm text-gray-500">
          결제가 완료되면 도입이 반영되고 대시보드로 이동합니다.
        </p>
      </div>

      <CheckoutForm clientSecret={clientSecret} purchaseId={purchaseId} />
    </div>
  );
}