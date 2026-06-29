import { MaterialPreviewBlur } from "@/components/material-preview-blur";
import { MaterialPurchaseCard } from "@/components/material-purchase-card";
import { Navbar } from "@/components/navbar";
import { PurchaseVerifier } from "@/components/purchase-verifier";
import { ReviewForm } from "@/components/review-form";
import { StarRating } from "@/components/star-rating";
import {
  getPurchaseCount,
  linkPurchasesByEmail,
  userHasPurchased,
} from "@/lib/purchases";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { Suspense } from "react";
import type { ReactNode } from "react";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

type Material = {
  id: string;
  title: string;
  certification_name: string;
  created_at: string;
  cover_image_url: string | null;
  listing_description: string | null;
  price: number | null;
  stripe_payment_link: string | null;
  is_published: boolean;
  is_ai_generated: boolean;
  file_url: string | null;
  file_type: string | null;
  user_id: string;
};

type ReviewRow = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user_id: string;
  profiles: { display_name: string | null } | null;
};

function formatCreatedAt(dateString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

function formatReviewDate(dateString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(dateString));
}

function getSummary(text: string | null, maxLength = 160): string {
  if (!text) return "説明文はまだ設定されていません。";
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength)}…`;
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

function getReviewerName(review: ReviewRow): string {
  const name = review.profiles?.display_name?.trim();
  if (name) return name;
  return `ユーザー${review.user_id.slice(0, 6)}`;
}

function CheckItem({ children }: { children: ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-gray-800">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#E91E63]/10 text-xs font-bold text-[#E91E63]">
        ✓
      </span>
      <span>{children}</span>
    </li>
  );
}

export default async function MaterialPage({ params, searchParams }: PageProps) {
  noStore();
  const { id } = await params;
  await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: materialRow, error: materialError } = await supabase
    .from("materials")
    .select(
      "id, title, certification_name, created_at, cover_image_url, listing_description, price, stripe_payment_link, is_published, is_ai_generated, file_url, file_type, user_id",
    )
    .eq("id", id)
    .maybeSingle();

  if (materialError) {
    console.error("Failed to load material:", materialError.message);
  }

  const material = materialRow as Material | null;
  const isOwner = user && material?.user_id === user.id;
  const isPublished = material?.is_published === true;
  const canView = material && (isPublished || isOwner);
  const isPdfMaterial = material?.is_ai_generated === false;

  if (!canView || !material) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <main className="mx-auto max-w-3xl px-4 pt-20 pb-10">
          <div className="rounded-lg border border-gray-200 p-8 text-center">
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

  const [{ data: sessionData }, { data: creatorProfile }, { data: reviewsRaw }] =
    await Promise.all([
      material.is_ai_generated
        ? supabase
            .from("generation_sessions")
            .select("generated_html")
            .eq("material_id", id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("profiles")
        .select("display_name")
        .eq("id", material.user_id)
        .maybeSingle(),
      supabase
        .from("reviews")
        .select("id, rating, comment, created_at, user_id, profiles(display_name)")
        .eq("material_id", id)
        .order("created_at", { ascending: false }),
    ]);

  const reviews = (reviewsRaw ?? []) as ReviewRow[];
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;
  const hasExistingReview = user
    ? reviews.some((r) => r.user_id === user.id)
    : false;

  let hasPurchased = false;
  let purchaseCount = 0;

  if (user?.email) {
    try {
      await linkPurchasesByEmail(user.id, user.email);
      hasPurchased = await userHasPurchased(id, user.id, user.email);
    } catch {
      hasPurchased = false;
    }
  }

  try {
    purchaseCount = await getPurchaseCount(id);
  } catch {
    purchaseCount = 0;
  }

  const creatorName =
    creatorProfile?.display_name?.trim() ?? "出品者";
  const generatedHtml = sessionData?.generated_html ?? null;
  const pdfFileName =
    isPdfMaterial && material.file_url
      ? getFileNameFromUrl(material.file_url)
      : null;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <Suspense fallback={null}>
        <PurchaseVerifier materialId={id} />
      </Suspense>

      {/* ヒーローヘッダー */}
      <section className="bg-gradient-to-br from-[#C2185B] to-[#E91E63] pt-16 text-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
          <nav className="mb-4 text-xs text-white/70">
            <Link href="/" className="hover:text-white">
              教材
            </Link>
            <span className="mx-2">›</span>
            <span className="text-white/90">{material.certification_name}</span>
          </nav>

          <h1 className="max-w-3xl text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl">
            {material.title}
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-white/90 sm:text-base">
            {getSummary(material.listing_description)}
          </p>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {reviewCount > 0 ? (
              <>
                <StarRating rating={averageRating} size="sm" showValue />
                <span className="text-[#f4c150] underline-offset-2 hover:underline">
                  ({reviewCount}件のレビュー)
                </span>
              </>
            ) : (
              <span className="text-white/70">レビューはまだありません</span>
            )}
            <span className="text-white/50">·</span>
            <span className="text-white/90">購入者 {purchaseCount}人</span>
          </div>

          <p className="mt-3 text-xs text-white/70">
            作成者: {creatorName}
            {isOwner && (
              <>
                {" · "}
                <Link
                  href={`/sell/${id}`}
                  className="text-white underline-offset-4 hover:underline"
                >
                  出品情報を編集
                </Link>
              </>
            )}
          </p>
        </div>
      </section>

      {/* メイン + サイドバー */}
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
          {/* 左カラム */}
          <main className="min-w-0 flex-1 lg:w-[68%]">
            {/* この教材について */}
            <section className="mb-10">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                この教材について
              </h2>
              <div className="whitespace-pre-wrap text-base leading-relaxed text-gray-800">
                {material.listing_description || "説明文はまだ設定されていません。"}
              </div>
              {isPdfMaterial && pdfFileName && (
                <div className="mt-6 rounded-lg border border-gray-200 bg-[#FDF2F7] p-5">
                  <p className="text-sm text-gray-700">
                    購入後にPDFをダウンロードできます
                  </p>
                  <p className="mt-2 text-sm font-medium text-gray-900">
                    📄 {pdfFileName}
                  </p>
                </div>
              )}
            </section>

            {/* 学習内容（AIのみ） */}
            {material.is_ai_generated && (
              <section className="mb-10">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  学習内容
                </h2>
                <div className="rounded-lg border border-gray-200 p-6">
                  <ul className="space-y-3">
                    <CheckItem>AI生成の予想問題集</CheckItem>
                    <CheckItem>印刷して使用可能</CheckItem>
                    <CheckItem>解答・解説付き</CheckItem>
                  </ul>
                </div>
              </section>
            )}

            {/* 問題集プレビュー（AIのみ） */}
            {material.is_ai_generated && generatedHtml && (
              <section className="mb-10">
                <h2 className="mb-4 text-xl font-bold text-gray-900">
                  問題集プレビュー
                </h2>
                <MaterialPreviewBlur html={generatedHtml} />
                <p className="mt-3 text-sm text-gray-500">
                  購入後、すべての問題・解説をご覧いただけます
                </p>
              </section>
            )}

            {/* レビュー */}
            <section>
              <h2 className="mb-6 text-xl font-bold text-gray-900">レビュー</h2>

              {reviewCount > 0 ? (
                <div className="mb-8 flex items-center gap-4">
                  <span className="text-5xl font-bold text-gray-900">
                    {averageRating.toFixed(1)}
                  </span>
                  <div>
                    <StarRating rating={averageRating} size="lg" />
                    <p className="mt-1 text-sm text-gray-500">
                      {reviewCount}件の評価
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mb-8 text-sm text-gray-500">
                  まだレビューはありません。最初のレビューを投稿してみましょう。
                </p>
              )}

              <div className="mb-8 space-y-6">
                {reviews.map((review) => (
                  <article
                    key={review.id}
                    className="border-b border-gray-100 pb-6 last:border-0"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {getReviewerName(review)}
                      </span>
                      <StarRating rating={review.rating} size="sm" />
                      <span className="text-xs text-gray-400">
                        {formatReviewDate(review.created_at)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                        {review.comment}
                      </p>
                    )}
                  </article>
                ))}
              </div>

              <ReviewForm
                materialId={id}
                hasExistingReview={hasExistingReview}
                hasPurchased={hasPurchased}
                isLoggedIn={!!user}
                isOwner={!!isOwner}
              />
            </section>
          </main>

          {/* 右サイドバー */}
          <aside className="w-full shrink-0 lg:sticky lg:top-20 lg:w-[32%]">
            <MaterialPurchaseCard
              materialId={id}
              title={material.title}
              coverImageUrl={material.cover_image_url}
              isAiGenerated={material.is_ai_generated}
              isPdfMaterial={isPdfMaterial}
              pdfFileName={pdfFileName}
              createdAtLabel={formatCreatedAt(material.created_at)}
              fallbackPrice={material.price}
              fallbackStripePaymentLink={material.stripe_payment_link}
            />

            <Link
              href={user ? "/dashboard" : "/"}
              className="mt-4 inline-block text-sm font-medium text-[#E91E63] underline-offset-4 hover:underline"
            >
              {user ? "ダッシュボードに戻る" : "トップへ戻る"}
            </Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
