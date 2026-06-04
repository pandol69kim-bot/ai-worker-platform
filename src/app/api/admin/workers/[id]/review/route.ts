import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { applyAdminWorkerStatusChange } from "@/lib/admin-worker-status";
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

    const result = await applyAdminWorkerStatusChange({
      workerIds: [id],
      reviewerId: user.id!,
      targetStatus: newStatus as "approved" | "published" | "rejected",
      note,
      score,
    });

    if (result.updatedCount === 0) {
      const skipReason = result.skipped[0]?.reason ?? "상태를 변경할 수 없습니다.";
      return NextResponse.json({ error: skipReason }, { status: 400 });
    }

    const updated = result.updatedWorkers[0];

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
