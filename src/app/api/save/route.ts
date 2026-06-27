import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type SaveRequestBody = {
  title: string;
  certName: string;
  generatedHtml: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function assertBody(body: unknown): SaveRequestBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid JSON body");
  }
  const b = body as Partial<SaveRequestBody>;
  if (
    !isNonEmptyString(b.title) ||
    !isNonEmptyString(b.certName) ||
    !isNonEmptyString(b.generatedHtml)
  ) {
    throw new Error("Missing required fields");
  }
  return {
    title: b.title.trim(),
    certName: b.certName.trim(),
    generatedHtml: b.generatedHtml,
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

    const { data: material, error: materialError } = await supabase
      .from("materials")
      .insert({
        user_id: user.id,
        title: body.title,
        certification_name: body.certName,
        is_ai_generated: true,
        is_published: false,
      })
      .select("id")
      .single();

    if (materialError || !material) {
      return NextResponse.json(
        { error: materialError?.message ?? "Failed to save material" },
        { status: 400 },
      );
    }

    const { error: sessionError } = await supabase
      .from("generation_sessions")
      .insert({
        user_id: user.id,
        material_id: material.id,
        title: body.title,
        generated_html: body.generatedHtml,
        status: "done",
      });

    if (sessionError) {
      return NextResponse.json(
        { error: sessionError.message },
        { status: 400 },
      );
    }

    return NextResponse.json({ success: true, materialId: material.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
