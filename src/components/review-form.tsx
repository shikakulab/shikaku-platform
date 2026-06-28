"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ReviewFormProps = {
  materialId: string;
  hasExistingReview: boolean;
  hasPurchased: boolean;
  isLoggedIn: boolean;
  isOwner: boolean;
};

export function ReviewForm({
  materialId,
  hasExistingReview,
  hasPurchased,
  isLoggedIn,
  isOwner,
}: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasExistingReview) {
    return (
      <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        レビュー済みです
      </p>
    );
  }

  if (isOwner) {
    return (
      <p className="text-sm text-gray-600">
        出品者はレビューを投稿できません。
      </p>
    );
  }

  if (!isLoggedIn) {
    return (
      <p className="text-sm text-gray-600">
        レビューを投稿するには
        <a
          href="/auth/login"
          className="mx-1 font-medium text-[#E91E63] underline-offset-4 hover:underline"
        >
          ログイン
        </a>
        してください。購入時と同じメールアドレスでログインしてください。
      </p>
    );
  }

  if (!hasPurchased) {
    return (
      <p className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600">
        この教材を購入した方のみレビューを投稿できます。Stripeで購入後、同じメールアドレスでログインしてこのページに戻ってください。
      </p>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (rating < 1 || rating > 5) {
      setError("星評価を選択してください");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ materialId, rating, comment }),
      });

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "レビューの投稿に失敗しました");
        return;
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "レビューの投稿に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  const displayRating = hoverRating || rating;

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-gray-200 p-5"
    >
      <div>
        <p className="mb-2 text-sm font-medium text-gray-700">評価</p>
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setRating(value)}
                onMouseEnter={() => setHoverRating(value)}
                onMouseLeave={() => setHoverRating(0)}
                className={`text-2xl transition-colors ${
                  value <= displayRating ? "text-[#f4c150]" : "text-gray-300"
                }`}
                aria-label={`${value}つ星`}
              >
                ★
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="reviewComment"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          コメント
        </label>
        <textarea
          id="reviewComment"
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="教材の感想を書いてください"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#E91E63] focus:outline-none focus:ring-1 focus:ring-[#E91E63]"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-md bg-[#E91E63] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C2185B] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "投稿中..." : "レビューを投稿する"}
      </button>
    </form>
  );
}
