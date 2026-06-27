import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type PageProps = {
  params: Promise<{ id: string }>;
};

type Material = {
  id: string;
  title: string;
  certification_name: string;
  created_at: string;
  cover_image_url: string | null;
  listing_description: string | null;
  price: number | null;
  is_published: boolean;
  is_ai_generated: boolean;
  file_url: string | null;
  file_type: string | null;
  user_id: string;
};

function formatCreatedAt(dateString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

function getPurchaseButtonLabel(price: number | null): string {
  const value = price ?? 0;
  if (value > 0) {
    return `¥${value.toLocaleString("ja-JP")} で購入する（準備中）`;
  }
  return "無料で入手する（準備中）";
}

function getFileNameFromUrl(url: string): string {
  try {
    const segment = new URL(url).pathname.split("/").pop() ?? "document.pdf";
    const decoded = decodeURIComponent(segment);
    return decoded.replace(/^(?:cover_)?\d+_/, "") || "document.pdf";
  } catch {
    return "document.pdf";
  }
}

function PdfIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="h-8 w-8 shrink-0 text-[#E91E63]"
      aria-hidden="true"
    >
      <path d="M6 2a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6H6zm7 1.5L18.5 9H13V3.5zM8 12h8v2H8v-2zm0 4h8v2H8v-2z" />
    </svg>
  );
}

export default async function MaterialPage({ params }: PageProps) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: material } = await supabase
    .from("materials")
    .select(
      "id, title, certification_name, created_at, cover_image_url, listing_description, price, is_published, is_ai_generated, file_url, file_type, user_id",
    )
    .eq("id", id)
    .maybeSingle();

  const data = material as Material | null;
  const isOwner = user && data?.user_id === user.id;
  const isPublished = data?.is_published === true;
  const canView = data && (isPublished || isOwner);
  const isPdfMaterial = data?.is_ai_generated === false;

  if (!canView) {
    return (
      <div className="min-h-screen bg-[#FDF2F7]">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-20 pb-10">
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <p className="text-gray-600">問題集が見つかりません</p>
            <Link
              href={user ? "/dashboard" : "/"}
              className="mt-4 inline-block text-sm font-medium text-[#E91E63] underline-offset-4 hover:underline"
            >
              {user ? "ダッシュボードに戻る" : "トップへ戻る"}
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const pdfFileName =
    isPdfMaterial && data.file_url
      ? getFileNameFromUrl(data.file_url)
      : null;

  return (
    <div className="min-h-screen bg-[#FDF2F7]">
      <Navbar />
      <main className="mx-auto max-w-[800px] px-4 pt-20 pb-10">
        <article className="overflow-hidden rounded-lg bg-white shadow-md">
          {data.cover_image_url ? (
            <img
              src={data.cover_image_url}
              alt={data.title}
              className="aspect-[16/9] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[16/9] w-full items-center justify-center bg-gray-200 text-sm text-gray-500">
              カバー画像なし
            </div>
          )}

          <div className="p-6 sm:p-8">
            {isPdfMaterial ? (
              <span className="inline-block rounded-full bg-[#E91E63] px-3 py-1 text-xs font-medium text-white">
                PDF教材
              </span>
            ) : (
              <p className="text-sm font-medium text-[#E91E63]">
                {data.certification_name}
              </p>
            )}
            <h1 className="mt-2 text-2xl font-bold leading-snug text-gray-900 sm:text-3xl">
              {data.title}
            </h1>
            <p className="mt-3 text-sm text-gray-500">
              {formatCreatedAt(data.created_at)}
            </p>
            {isOwner && (
              <Link
                href={`/sell/${id}`}
                className="mt-3 inline-block text-sm font-medium text-[#E91E63] underline-offset-4 hover:underline"
              >
                出品情報を編集
              </Link>
            )}

            <hr className="my-8 border-gray-200" />

            <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
              {data.listing_description || "説明文はまだ設定されていません。"}
            </div>

            {isPdfMaterial && pdfFileName && (
              <div className="mt-8 rounded-lg border border-gray-200 bg-[#FDF2F7] p-5">
                <p className="text-sm text-gray-700">
                  購入後にPDFをダウンロードできます
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <PdfIcon />
                  <span className="text-sm font-medium text-gray-900">
                    {pdfFileName}
                  </span>
                </div>
              </div>
            )}

            <hr className="my-8 border-gray-200" />

            <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-medium text-gray-700">
                {isPdfMaterial ? "この教材を入手する" : "この問題集を入手する"}
              </p>
              <p className="mt-3 text-3xl font-bold text-gray-900">
                {(data.price ?? 0) > 0
                  ? `¥${(data.price ?? 0).toLocaleString("ja-JP")}`
                  : "無料"}
              </p>
              <button
                type="button"
                disabled
                className="mt-4 w-full rounded-full bg-gray-300 px-4 py-3 text-sm font-medium text-gray-600"
              >
                {getPurchaseButtonLabel(data.price)}
              </button>
              <p className="mt-3 text-xs text-gray-500">
                ※決済機能は準備中です
              </p>
            </div>
          </div>
        </article>

        <div className="mt-6">
          <Link
            href={user ? "/dashboard" : "/"}
            className="text-sm font-medium text-[#E91E63] underline-offset-4 hover:underline"
          >
            {user ? "ダッシュボードに戻る" : "トップへ戻る"}
          </Link>
        </div>
      </main>
    </div>
  );
}
