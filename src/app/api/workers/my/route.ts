import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = session.user as { id: string };

  const workers = await db.aIWorker.findMany({
    where: { makerId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(workers);
}
