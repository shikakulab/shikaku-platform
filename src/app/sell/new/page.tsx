"use client";

import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#DE2261] focus:outline-none focus:ring-1 focus:ring-[#DE2261]";

const textareaClassName = `${inputClassName} resize-y`;

const buttonClassName =
  "w-full rounded-full bg-[#DE2261] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B81D52] disabled:cursor-not-allowed disabled:opacity-60";

async function uploadFile(
  file: File,
  uploadType?: "cover",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (uploadType === "cover") {
    formData.append("uploadType", "cover");
  }

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });

  const data = (await res.json()) as { url?: string; error?: string };

  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "アップロードに失敗しました");
  }

  return data.url;
}

export default function SellNewPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [price, setPrice] = useState("");
  const [stripePaymentLink, setStripePaymentLink] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loadingAuth, setLoadingAuth] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setLoadingAuth(false);
    }

    checkAuth();
  }, [router]);

  function handlePdfChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPdfFile(file);
    setPdfFileName(file.name);
  }

  async function handleCoverChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setUploadStatus("カバー画像をアップロード中...");

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const url = await uploadFile(file, "cover");
      setCoverImageUrl(url);
      setPreviewUrl(url);
    } catch (e) {
      setPreviewUrl(coverImageUrl || null);
      setError(
        e instanceof Error ? e.message : "カバー画像のアップロードに失敗しました",
      );
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!pdfFile) {
      setError("PDFファイルを選択してください");
      return;
    }

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("販売価格を正しく入力してください");
      return;
    }

    setSubmitting(true);
    setUploading(true);

    try {
      setUploadStatus("PDFをアップロード中...");
      const fileUrl = await uploadFile(pdfFile);

      setUploadStatus("");
      setUploading(false);

      const res = await fetch("/api/sell/new", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title,
          listingDescription,
          fileUrl,
          coverImageUrl: coverImageUrl || undefined,
          price: priceNumber,
          stripePaymentLink: stripePaymentLink || undefined,
        }),
      });

      const data = (await res.json()) as {
        success?: boolean;
        materialId?: string;
        error?: string;
      };

      if (!res.ok || !data.materialId) {
        setError(data.error ?? "出品に失敗しました");
        return;
      }

      router.push(`/material/${data.materialId}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "出品に失敗しました");
    } finally {
      setUploading(false);
      setUploadStatus("");
      setSubmitting(false);
    }
  }

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-[#FDF2F7]">
        <Navbar />
        <main className="mx-auto max-w-2xl px-4 pt-20 pb-10">
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDF2F7]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 pt-20 pb-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">PDFを出品する</h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#DE2261] underline-offset-4 hover:underline"
          >
            ダッシュボードへ
          </Link>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-5 rounded-lg bg-white p-6 shadow-md"
        >
          {error && (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <div>
            <label
              htmlFor="title"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              商品名
            </label>
            <input
              id="title"
              type="text"
              required
              placeholder="例）日商簿記3級 予想問題集"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="listingDescription"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              説明文
            </label>
            <textarea
              id="listingDescription"
              rows={8}
              required
              placeholder="取得時期・難易度・内容の説明など"
              value={listingDescription}
              onChange={(e) => setListingDescription(e.target.value)}
              className={textareaClassName}
            />
          </div>

          <div>
            <label
              htmlFor="pdfFile"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              PDF教材ファイル
            </label>
            <input
              id="pdfFile"
              type="file"
              accept=".pdf"
              required
              onChange={handlePdfChange}
              disabled={uploading || submitting}
              className="w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#DE2261] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#B81D52]"
            />
            {pdfFileName && (
              <p className="mt-2 text-sm text-gray-600">選択中: {pdfFileName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="coverImage"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              カバー画像（任意）
            </label>
            <input
              id="coverImage"
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              disabled={uploading || submitting}
              className="w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#DE2261] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#B81D52]"
            />
            {previewUrl && (
              <img
                src={previewUrl}
                alt="カバー画像プレビュー"
                className="mt-4 aspect-[16/9] w-full rounded-md object-cover"
              />
            )}
          </div>

          <div>
            <label
              htmlFor="price"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              販売価格（円）
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step={1}
              required
              placeholder="0と入力すると無料になります"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className={inputClassName}
            />
          </div>

          <div>
            <label
              htmlFor="stripePaymentLink"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Stripe決済リンク（任意）
            </label>
            <input
              id="stripePaymentLink"
              type="text"
              placeholder="https://buy.stripe.com/..."
              value={stripePaymentLink}
              onChange={(e) => setStripePaymentLink(e.target.value)}
              className={inputClassName}
            />
          </div>

          {(uploading || uploadStatus) && (
            <p className="text-sm text-gray-500">
              {uploadStatus || "アップロード中..."}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || uploading}
            className={buttonClassName}
          >
            {uploading
              ? "アップロード中..."
              : submitting
                ? "出品中..."
                : "出品する"}
          </button>
        </form>
      </main>
    </div>
  );
}
