import { createClient } from "@/lib/supabase/server";
import { userHasPurchased } from "@/lib/purchases";
import { ensureProfile } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

type ReviewRequestBody = {
  materialId: string;
  rating: number;
  comment?: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function parseRating(value: unknown): number {
  const rating = Math.floor(Number(value));
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw new Error("Invalid rating");
  }
  return rating;
}

function assertBody(body: unknown): ReviewRequestBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid JSON body");
  }
  const b = body as Partial<ReviewRequestBody>;
  if (!isNonEmptyString(b.materialId)) {
    throw new Error("Missing materialId");
  }
  if (b.rating === undefined || b.rating === null) {
    throw new Error("Invalid rating");
  }
  return {
    materialId: b.materialId.trim(),
    rating: parseRating(b.rating),
    comment: typeof b.comment === "string" ? b.comment.trim() : undefined,
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

    const { data: material } = await supabase
      .from("materials")
      .select("id, user_id")
      .eq("id", body.materialId)
      .eq("is_published", true)
      .maybeSingle();

    if (!material) {
      return NextResponse.json({ error: "Material not found" }, { status: 404 });
    }

    if (material.user_id === user.id) {
      return NextResponse.json(
        { error: "自分の出品にはレビューできません" },
        { status: 400 },
      );
    }

    const purchased = await userHasPurchased(
      body.materialId,
      user.id,
      user.email,
    );

    if (!purchased) {
      return NextResponse.json(
        { error: "購入済みのユーザーのみレビューできます" },
        { status: 403 },
      );
    }

    await ensureProfile(user.id, user.email?.split("@")[0] ?? null);

    const { error } = await supabase.from("reviews").insert({
      material_id: body.materialId,
      user_id: user.id,
      rating: body.rating,
      comment: body.comment && body.comment.length > 0 ? body.comment : null,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "この教材には既にレビュー済みです" },
          { status: 400 },
        );
      }
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
