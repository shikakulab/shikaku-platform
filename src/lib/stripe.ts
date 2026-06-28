import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }

  return stripeClient;
}

export function normalizeStripeUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

export async function sessionMatchesMaterialPaymentLink(
  session: Stripe.Checkout.Session,
  materialPaymentLink: string | null,
): Promise<boolean> {
  if (!materialPaymentLink?.trim()) {
    return false;
  }

  const storedLink = normalizeStripeUrl(materialPaymentLink);

  if (session.payment_link) {
    const stripe = getStripe();
    const paymentLink = await stripe.paymentLinks.retrieve(
      session.payment_link as string,
    );
    if (paymentLink.url && normalizeStripeUrl(paymentLink.url) === storedLink) {
      return true;
    }
  }

  const storedSlug = storedLink.split("/").pop();
  const successUrl = session.success_url ?? "";
  const cancelUrl = session.cancel_url ?? "";

  return Boolean(
    storedSlug &&
      (successUrl.includes(storedSlug) ||
        cancelUrl.includes(storedSlug) ||
        storedLink.includes(storedSlug)),
  );
}
