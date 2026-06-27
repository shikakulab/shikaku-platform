import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type PublishRequestBody = {
  materialId: string;
  title: string;
  listingDescription: string;
  price: number;
  coverImageUrl?: string;
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

function assertBody(body: unknown): PublishRequestBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid JSON body");
  }
  const b = body as Partial<PublishRequestBody>;
  if (
    !isNonEmptyString(b.materialId) ||
    !isNonEmptyString(b.title) ||
    !isNonEmptyString(b.listingDescription)
  ) {
    throw new Error("Missing required fields");
  }
  if (b.price === undefined || b.price === null) {
    throw new Error("Invalid price");
  }
  return {
    materialId: b.materialId.trim(),
    title: b.title.trim(),
    listingDescription: b.listingDescription.trim(),
    price: parsePrice(b.price),
    coverImageUrl:
      typeof b.coverImageUrl === "string" ? b.coverImageUrl.trim() : undefined,
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

    const { data: updated, error } = await supabase
      .from("materials")
      .update({
        is_published: true,
        title: body.title,
        listing_description: body.listingDescription,
        price: body.price,
        cover_image_url: coverImageUrl,
      })
      .eq("id", body.materialId)
      .eq("user_id", user.id)
      .select("id, cover_image_url")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json(
        { error: "Material not found or update failed" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      coverImageUrl: updated.cover_image_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
