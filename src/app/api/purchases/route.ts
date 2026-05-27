import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { createPaymentIntent } from "@/lib/stripe";

const purchaseSchema = z.object({
  workerId: z.string(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = session.user as { id: string };

  try {
    const body = await req.json();
    const { workerId } = purchaseSchema.parse(body);

    const worker = await db.aIWorker.findUnique({ where: { id: workerId } });
    if (!worker || worker.status !== "published") {
      return NextResponse.json({ error: "AI 직원을 찾을 수 없습니다." }, { status: 404 });
    }

    const existing = await db.purchase.findFirst({
      where: { userId: user.id, workerId, paymentStatus: "completed" },
    });

    if (existing) {
      return NextResponse.json({ error: "이미 구매한 AI 직원입니다." }, { status: 409 });
    }

    if (worker.priceType === "free" || worker.price === 0) {
      const purchase = await db.purchase.create({
        data: {
          userId: user.id,
          workerId,
          amount: 0,
          paymentStatus: "completed",
        },
      });

      await db.aIWorker.update({
        where: { id: workerId },
        data: { totalSales: { increment: 1 } },
      });

      return NextResponse.json({ purchase, message: "무료로 도입되었습니다." });
    }

    const paymentIntent = await createPaymentIntent(worker.price, "krw", {
      workerId,
      userId: user.id,
    });

    const purchase = await db.purchase.create({
      data: {
        userId: user.id,
        workerId,
        amount: worker.price,
        paymentId: paymentIntent.id,
        paymentStatus: "pending",
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      purchaseId: purchase.id,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }
    console.error("Purchase error:", error);
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const user = session.user as { id: string };

  const purchases = await db.purchase.findMany({
    where: { userId: user.id, paymentStatus: "completed" },
    include: {
      worker: {
        select: { id: true, title: true, category: true, thumbnail: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(purchases);
}
