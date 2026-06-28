import { createAdminClient } from "@/lib/supabase/admin";
import {
  getStripe,
  sessionMatchesMaterialPaymentLink,
} from "@/lib/stripe";
import type Stripe from "stripe";

type RecordPurchaseInput = {
  materialId: string;
  session: Stripe.Checkout.Session;
  userId?: string | null;
};

export async function recordPurchaseFromSession({
  materialId,
  session,
  userId = null,
}: RecordPurchaseInput) {
  if (session.payment_status !== "paid") {
    throw new Error("Payment not completed");
  }

  const purchaserEmail = session.customer_details?.email?.trim().toLowerCase();
  if (!purchaserEmail) {
    throw new Error("Purchaser email not found on Stripe session");
  }

  const admin = createAdminClient();

  const { data: material, error: materialError } = await admin
    .from("materials")
    .select("id, stripe_payment_link")
    .eq("id", materialId)
    .eq("is_published", true)
    .maybeSingle();

  if (materialError || !material) {
    throw new Error("Material not found");
  }

  const matches = await sessionMatchesMaterialPaymentLink(
    session,
    material.stripe_payment_link,
  );

  if (!matches) {
    throw new Error("This payment does not match the material");
  }

  const { error } = await admin.from("purchases").upsert(
    {
      material_id: materialId,
      user_id: userId,
      purchaser_email: purchaserEmail,
      stripe_session_id: session.id,
    },
    { onConflict: "stripe_session_id" },
  );

  if (error) {
    if (error.code === "23505") {
      if (userId) {
        await admin
          .from("purchases")
          .update({ user_id: userId })
          .eq("stripe_session_id", session.id);
      }
      return;
    }
    throw new Error(error.message);
  }
}

export async function linkPurchasesByEmail(userId: string, email: string) {
  const admin = createAdminClient();
  await admin
    .from("purchases")
    .update({ user_id: userId })
    .eq("purchaser_email", email.trim().toLowerCase())
    .is("user_id", null);
}

export async function userHasPurchased(
  materialId: string,
  userId: string,
  email?: string | null,
): Promise<boolean> {
  const admin = createAdminClient();

  const { data: byUserId } = await admin
    .from("purchases")
    .select("id")
    .eq("material_id", materialId)
    .eq("user_id", userId)
    .maybeSingle();

  if (byUserId) {
    return true;
  }

  if (!email) {
    return false;
  }

  const { data: byEmail } = await admin
    .from("purchases")
    .select("id")
    .eq("material_id", materialId)
    .eq("purchaser_email", email.trim().toLowerCase())
    .maybeSingle();

  return Boolean(byEmail);
}

export async function getPurchaseCount(materialId: string): Promise<number> {
  const admin = createAdminClient();
  const { count, error } = await admin
    .from("purchases")
    .select("id", { count: "exact", head: true })
    .eq("material_id", materialId);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

export async function verifyAndRecordPurchase(
  materialId: string,
  sessionId: string,
  userId: string,
  userEmail: string,
) {
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  const purchaserEmail = session.customer_details?.email?.trim().toLowerCase();
  if (purchaserEmail && purchaserEmail !== userEmail.trim().toLowerCase()) {
    throw new Error(
      "Stripeの購入メールアドレスとログイン中のアカウントが一致しません",
    );
  }

  await recordPurchaseFromSession({
    materialId,
    session,
    userId,
  });

  await linkPurchasesByEmail(userId, userEmail);
}
