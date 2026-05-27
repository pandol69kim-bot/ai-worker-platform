export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WorkerForm } from "@/components/worker/WorkerForm";

export default async function CreateWorkerPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">새 AI 직원 만들기</h1>
        <p className="text-gray-500 mt-1">업무 노하우를 AI 직원으로 상품화하세요</p>
      </div>
      <WorkerForm />
    </div>
  );
}
