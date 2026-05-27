import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { id } = await params;
  const user = session.user as { id: string };

  const worker = await db.aIWorker.findUnique({ where: { id } });
  if (!worker) {
    return NextResponse.json({ error: "AI 직원을 찾을 수 없습니다." }, { status: 404 });
  }

  if (worker.makerId !== user.id) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }

  if (!["draft", "rejected"].includes(worker.status)) {
    return NextResponse.json({ error: "초안 또는 반려된 AI 직원만 제출할 수 있습니다." }, { status: 400 });
  }

  const updated = await db.aIWorker.update({
    where: { id },
    data: { status: "submitted" },
  });

  return NextResponse.json(updated);
}
