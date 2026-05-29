import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

type SyncPurchaseResult = {
  status: "completed" | "pending" | "failed" | "not_found";
  purchaseId?: string;
  workerId?: string;
};

export async function syncPurchasePaymentStatus(purchaseId: string, userId?: string): Promise<SyncPurchaseResult> {
  const purchase = await db.purchase.findUnique({
    where: { id: purchaseId },
    include: {
      worker: {
        select: { id: true, makerId: true },
      },
    },
  });

  if (!purchase || (userId && purchase.userId !== userId)) {
    return { status: "not_found" };
  }

  if (purchase.paymentStatus === "completed") {
    return {
      status: "completed",
      purchaseId: purchase.id,
      workerId: purchase.workerId,
    };
  }

  if (!purchase.paymentId) {
    return {
      status: purchase.paymentStatus === "failed" ? "failed" : "pending",
      purchaseId: purchase.id,
      workerId: purchase.workerId,
    };
  }

  const paymentIntent = await stripe.paymentIntents.retrieve(purchase.paymentId);

  if (paymentIntent.status !== "succeeded") {
    return {
      status: paymentIntent.status === "canceled" ? "failed" : "pending",
      purchaseId: purchase.id,
      workerId: purchase.workerId,
    };
  }

  await db.$transaction(async (tx) => {
    const latestPurchase = await tx.purchase.findUnique({
      where: { id: purchase.id },
      include: {
        worker: {
          select: { makerId: true },
        },
      },
    });

    if (!latestPurchase || latestPurchase.paymentStatus === "completed") {
      return;
    }

    await tx.purchase.update({
      where: { id: latestPurchase.id },
      data: { paymentStatus: "completed" },
    });

    await tx.aIWorker.update({
      where: { id: latestPurchase.workerId },
      data: { totalSales: { increment: 1 } },
    });

    const makerAmount = latestPurchase.amount * (1 - Number(process.env.PLATFORM_FEE_PERCENT ?? 20) / 100);

    const makerProfile = await tx.makerProfile.findUnique({
      where: { userId: latestPurchase.worker.makerId },
    });
    if (!makerProfile) {
      await tx.makerProfile.create({
        data: {
          userId: latestPurchase.worker.makerId,
          totalEarned: makerAmount,
        },
      });
    } else {
      await tx.makerProfile.update({
        where: { userId: latestPurchase.worker.makerId },
        data: { totalEarned: { increment: makerAmount } },
      });
    }
  });

  return {
    status: "completed",
    purchaseId: purchase.id,
    workerId: purchase.workerId,
  };
}