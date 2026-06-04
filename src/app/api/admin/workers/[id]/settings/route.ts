import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const settingsSchema = z.object({
  isAiConfigPublic: z.boolean(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { role?: string } | undefined;

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  try {
    const { isAiConfigPublic } = settingsSchema.parse(await req.json());
    const { id } = await params;

    const worker = await db.aIWorker.update({
      where: { id },
      data: { isAiConfigPublic },
      select: { id: true, isAiConfigPublic: true },
    });

    return NextResponse.json(worker);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}