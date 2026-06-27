import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type UpdateMaterialBody = {
  title: string;
  listingDescription: string;
  price: number;
  coverImageUrl?: string;
  fileUrl?: string;
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

function assertUpdateBody(body: unknown): UpdateMaterialBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid JSON body");
  }
  const b = body as Partial<UpdateMaterialBody>;
  if (
    !isNonEmptyString(b.title) ||
    !isNonEmptyString(b.listingDescription)
  ) {
    throw new Error("Missing required fields");
  }
  if (b.price === undefined || b.price === null) {
    throw new Error("Invalid price");
  }
  return {
    title: b.title.trim(),
    listingDescription: b.listingDescription.trim(),
    price: parsePrice(b.price),
    coverImageUrl:
      typeof b.coverImageUrl === "string" ? b.coverImageUrl.trim() : undefined,
    fileUrl: typeof b.fileUrl === "string" ? b.fileUrl.trim() : undefined,
  };
}

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PUT(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = assertUpdateBody(await request.json());

    const { data: existing } = await supabase
      .from("materials")
      .select("cover_image_url, is_ai_generated, file_url")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!existing) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const coverImageUrl =
      body.coverImageUrl && body.coverImageUrl.length > 0
        ? body.coverImageUrl
        : existing.cover_image_url;

    const fileUrl =
      body.fileUrl && body.fileUrl.length > 0
        ? body.fileUrl
        : existing.file_url;

    const updateData: {
      title: string;
      listing_description: string;
      price: number;
      cover_image_url: string | null;
      file_url?: string | null;
    } = {
      title: body.title,
      listing_description: body.listingDescription,
      price: body.price,
      cover_image_url: coverImageUrl,
    };

    if (!existing.is_ai_generated) {
      updateData.file_url = fileUrl;
    }

    const { data: updated, error } = await supabase
      .from("materials")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, cover_image_url, file_url")
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!updated) {
      return NextResponse.json({ error: "Update failed" }, { status: 404 });
    }

    if (existing.is_ai_generated) {
      await supabase
        .from("generation_sessions")
        .update({ title: body.title })
        .eq("material_id", id)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      coverImageUrl: updated.cover_image_url,
      fileUrl: updated.file_url,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: material } = await supabase
      .from("materials")
      .select("id")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    const { error: sessionError } = await supabase
      .from("generation_sessions")
      .delete()
      .eq("material_id", id)
      .eq("user_id", user.id);

    if (sessionError) {
      return NextResponse.json({ error: sessionError.message }, { status: 400 });
    }

    const { error: materialError } = await supabase
      .from("materials")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (materialError) {
      return NextResponse.json({ error: materialError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
