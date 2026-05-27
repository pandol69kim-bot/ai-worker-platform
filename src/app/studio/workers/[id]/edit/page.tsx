import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { WorkerForm } from "@/components/worker/WorkerForm";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditWorkerPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { id } = await params;
  const user = session.user as { id: string };

  const worker = await db.aIWorker.findUnique({ where: { id, makerId: user.id } });
  if (!worker) notFound();

  if (!["draft", "rejected"].includes(worker.status)) {
    redirect("/studio");
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI 직원 편집</h1>
        <p className="text-gray-500 mt-1">{worker.title}</p>
      </div>
      <WorkerForm initialData={worker} />
    </div>
  );
}
