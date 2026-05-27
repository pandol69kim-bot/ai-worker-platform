import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  action: z.enum(["approve", "reject", "publish"]),
  note: z.string().optional(),
  score: z.number().min(0).max(10).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const user = session?.user as { id?: string; role?: string } | undefined;

  if (user?.role !== "admin") {
    return NextResponse.json({ error: "관리자 권한이 필요합니다." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { action, note, score } = reviewSchema.parse(body);

    const worker = await db.aIWorker.findUnique({ where: { id } });
    if (!worker) {
      return NextResponse.json({ error: "AI 직원을 찾을 수 없습니다." }, { status: 404 });
    }

    let newStatus: string;
    switch (action) {
      case "approve":
        newStatus = "approved";
        break;
      case "reject":
        newStatus = "rejected";
        break;
      case "publish":
        newStatus = "published";
        break;
    }

    await db.adminReview.create({
      data: {
        workerId: id,
        reviewerId: user.id!,
        score,
        note,
        status: newStatus,
      },
    });

    const updateData: Record<string, unknown> = {
      status: newStatus,
      rejectionNote: action === "reject" ? note : null,
    };

    if (action === "publish") {
      updateData.publishedAt = new Date();
    }

    const updated = await db.aIWorker.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
