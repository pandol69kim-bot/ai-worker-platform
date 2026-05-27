import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { db } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;

    const purchase = await db.purchase.findFirst({
      where: { paymentId: paymentIntent.id },
    });

    if (purchase) {
      await db.purchase.update({
        where: { id: purchase.id },
        data: { paymentStatus: "completed" },
      });

      await db.aIWorker.update({
        where: { id: purchase.workerId },
        data: { totalSales: { increment: 1 } },
      });

      const worker = await db.aIWorker.findUnique({
        where: { id: purchase.workerId },
      });

      if (worker) {
        const makerAmount = purchase.amount * (1 - Number(process.env.PLATFORM_FEE_PERCENT ?? 20) / 100);
        await db.makerProfile.update({
          where: { userId: worker.makerId },
          data: { totalEarned: { increment: makerAmount } },
        });
      }
    }
  }

  return NextResponse.json({ received: true });
}
