import { recordPurchaseFromSession } from "@/lib/purchases";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type Stripe from "stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "Missing STRIPE_WEBHOOK_SECRET" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const stripe = getStripe();
    const body = await request.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  if (session.payment_status !== "paid") {
    return NextResponse.json({ received: true });
  }

  try {
    const admin = createAdminClient();
    const { data: materials } = await admin
      .from("materials")
      .select("id, stripe_payment_link")
      .not("stripe_payment_link", "is", null);

    const stripe = getStripe();
    let matchedMaterialId: string | null = null;

    for (const material of materials ?? []) {
      if (!material.stripe_payment_link) continue;

      if (session.payment_link) {
        const paymentLink = await stripe.paymentLinks.retrieve(
          session.payment_link as string,
        );
        const stored = material.stripe_payment_link.trim().replace(/\/$/, "");
        const linkUrl = paymentLink.url?.trim().replace(/\/$/, "");
        if (linkUrl && linkUrl === stored) {
          matchedMaterialId = material.id;
          break;
        }
      }
    }

    if (!matchedMaterialId) {
      return NextResponse.json({ received: true, matched: false });
    }

    await recordPurchaseFromSession({
      materialId: matchedMaterialId,
      session,
      userId: null,
    });

    return NextResponse.json({ received: true, matched: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook handler failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
