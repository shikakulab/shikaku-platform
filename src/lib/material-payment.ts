import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type MaterialPaymentInfo = {
  price: number;
  stripePaymentLink: string;
};

async function fetchWithAdmin(
  materialId: string,
): Promise<MaterialPaymentInfo | null> {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("materials")
    .select("price, stripe_payment_link, is_published")
    .eq("id", materialId)
    .maybeSingle();

  if (error || !data?.is_published) {
    return null;
  }

  return {
    price: data.price ?? 0,
    stripePaymentLink: data.stripe_payment_link?.trim() ?? "",
  };
}

async function fetchWithServerClient(
  materialId: string,
): Promise<MaterialPaymentInfo | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("price, stripe_payment_link, is_published")
    .eq("id", materialId)
    .maybeSingle();

  if (error || !data?.is_published) {
    return null;
  }

  return {
    price: data.price ?? 0,
    stripePaymentLink: data.stripe_payment_link?.trim() ?? "",
  };
}

export async function getMaterialPaymentInfo(
  materialId: string,
  fallback?: { price: number | null; stripePaymentLink: string | null },
): Promise<MaterialPaymentInfo | null> {
  try {
    const fromAdmin = await fetchWithAdmin(materialId);
    if (fromAdmin?.stripePaymentLink) {
      return fromAdmin;
    }
  } catch {
    // service role unavailable — fall through
  }

  try {
    const fromServer = await fetchWithServerClient(materialId);
    if (fromServer?.stripePaymentLink) {
      return fromServer;
    }
  } catch {
    // fall through
  }

  if (fallback?.stripePaymentLink?.trim()) {
    return {
      price: fallback.price ?? 0,
      stripePaymentLink: fallback.stripePaymentLink.trim(),
    };
  }

  return null;
}
