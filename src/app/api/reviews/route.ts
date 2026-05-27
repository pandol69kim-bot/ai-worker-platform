import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";

const reviewSchema = z.object({
  workerId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = session.user as { id: string };

  try {
    const body = await req.json();
    const { workerId, rating, comment } = reviewSchema.parse(body);

    const purchase = await db.purchase.findFirst({
      where: { userId: user.id, workerId, paymentStatus: "completed" },
    });

    if (!purchase) {
      return NextResponse.json(
        { error: "구매한 AI 직원에만 리뷰를 작성할 수 있습니다." },
        { status: 403 }
      );
    }

    const review = await db.review.upsert({
      where: { userId_workerId: { userId: user.id, workerId } },
      update: { rating, comment },
      create: { userId: user.id, workerId, rating, comment },
    });

    const stats = await db.review.aggregate({
      where: { workerId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    await db.aIWorker.update({
      where: { id: workerId },
      data: {
        avgRating: stats._avg.rating ?? 0,
        reviewCount: stats._count.rating,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
