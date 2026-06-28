import { createClient } from "@/lib/supabase/server";
import { verifyAndRecordPurchase } from "@/lib/purchases";
import { NextResponse } from "next/server";

type VerifyPurchaseBody = {
  materialId: string;
  sessionId: string;
};

function assertBody(body: unknown): VerifyPurchaseBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid JSON body");
  }
  const b = body as Partial<VerifyPurchaseBody>;
  if (
    typeof b.materialId !== "string" ||
    !b.materialId.trim() ||
    typeof b.sessionId !== "string" ||
    !b.sessionId.trim()
  ) {
    throw new Error("Missing materialId or sessionId");
  }
  return {
    materialId: b.materialId.trim(),
    sessionId: b.sessionId.trim(),
  };
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = assertBody(await request.json());

    await verifyAndRecordPurchase(
      body.materialId,
      body.sessionId,
      user.id,
      user.email,
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
