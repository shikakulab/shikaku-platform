import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type SellNewRequestBody = {
  title: string;
  listingDescription: string;
  fileUrl: string;
  coverImageUrl?: string;
  price: number;
  stripePaymentLink?: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parsePrice(value: unknown): number {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Invalid price");
  }
  return Math.floor(price);
}

function assertBody(body: unknown): SellNewRequestBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid JSON body");
  }
  const b = body as Partial<SellNewRequestBody>;
  if (
    !isNonEmptyString(b.title) ||
    !isNonEmptyString(b.listingDescription) ||
    !isNonEmptyString(b.fileUrl)
  ) {
    throw new Error("Missing required fields");
  }
  if (b.price === undefined || b.price === null) {
    throw new Error("Invalid price");
  }
  return {
    title: b.title.trim(),
    listingDescription: b.listingDescription.trim(),
    fileUrl: b.fileUrl.trim(),
    coverImageUrl:
      typeof b.coverImageUrl === "string" ? b.coverImageUrl.trim() : undefined,
    price: parsePrice(b.price),
    stripePaymentLink:
      typeof b.stripePaymentLink === "string"
        ? b.stripePaymentLink.trim()
        : undefined,
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = assertBody(await request.json());

    const coverImageUrl =
      body.coverImageUrl && body.coverImageUrl.length > 0
        ? body.coverImageUrl
        : null;

    const stripePaymentLink =
      body.stripePaymentLink && body.stripePaymentLink.length > 0
        ? body.stripePaymentLink
        : null;

    const { data: material, error } = await supabase
      .from("materials")
      .insert({
        user_id: user.id,
        title: body.title,
        listing_description: body.listingDescription,
        certification_name: "PDF教材",
        file_url: body.fileUrl,
        file_type: "pdf",
        cover_image_url: coverImageUrl,
        price: body.price,
        stripe_payment_link: stripePaymentLink,
        is_ai_generated: false,
        is_published: true,
      })
      .select("id")
      .single();

    if (error || !material) {
      return NextResponse.json(
        { error: error?.message ?? "Failed to create material" },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, materialId: material.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
