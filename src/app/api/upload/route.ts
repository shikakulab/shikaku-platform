import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PDF_SIZE = 50 * 1024 * 1024; // 50MB

function sanitizeFileName(name: string, fallback: string): string {
  const sanitized = name.replace(/[^\w.-]/g, "_");
  return sanitized || fallback;
}

function isPdfFile(file: File): boolean {
  return (
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")
  );
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
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

    const formData = await request.formData();
    const file = formData.get("file");
    const uploadType = formData.get("uploadType");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const isPdf = isPdfFile(file);
    const isImage = isImageFile(file);

    if (uploadType === "cover") {
      if (!isImage) {
        return NextResponse.json(
          { error: "画像ファイルのみアップロードできます" },
          { status: 400 },
        );
      }
    } else if (!isPdf && !isImage) {
      return NextResponse.json(
        { error: "PDFまたは画像ファイルのみアップロードできます" },
        { status: 400 },
      );
    }

    const maxSize = isPdf ? MAX_PDF_SIZE : MAX_IMAGE_SIZE;
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: isPdf
            ? "PDFファイルサイズは50MB以下にしてください"
            : "ファイルサイズは5MB以下にしてください",
        },
        { status: 400 },
      );
    }

    const safeName = sanitizeFileName(
      file.name,
      isPdf ? `document_${Date.now()}.pdf` : `image_${Date.now()}.jpg`,
    );

    const filePath =
      uploadType === "cover"
        ? `${user.id}/cover_${Date.now()}_${safeName}`
        : `${user.id}/${Date.now()}_${safeName}`;

    const fileBuffer = await file.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("material-images")
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: true,
        contentType: file.type || "application/octet-stream",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data } = supabase.storage
      .from("material-images")
      .getPublicUrl(filePath);

    return NextResponse.json({ url: data.publicUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
