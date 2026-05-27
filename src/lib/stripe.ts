import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-04-22.dahlia",
});

export async function createPaymentIntent(
  amount: number,
  currency: string = "krw",
  metadata?: Record<string, string>
) {
  return stripe.paymentIntents.create({
    amount: Math.round(amount),
    currency,
    metadata,
  });
}
