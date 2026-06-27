"use client";

import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const inputClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#E91E63] focus:outline-none focus:ring-1 focus:ring-[#E91E63]";

const textareaClassName = `${inputClassName} resize-y`;

const buttonClassName =
  "w-full rounded-full bg-[#E91E63] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C2185B] disabled:cursor-not-allowed disabled:opacity-60";

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

function getFileNameFromUrl(url: string): string {
  try {
    const segment = new URL(url).pathname.split("/").pop() ?? "document.pdf";
    const decoded = decodeURIComponent(segment);
    return decoded.replace(/^(?:cover_)?\d+_/, "") || "document.pdf";
  } catch {
    return "document.pdf";
  }
}

export default function SellPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(true);
  const [isPublished, setIsPublished] = useState(false);
  const [title, setTitle] = useState("");
  const [listingDescription, setListingDescription] = useState("");
  const [price, setPrice] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfFileName, setPdfFileName] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [loadingMaterial, setLoadingMaterial] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMaterial() {
      setLoadingMaterial(true);
      setError(null);

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth/login");
        return;
      }

      setUserId(user.id);

      const { data, error: fetchError } = await supabase
        .from("materials")
        .select(
          "title, listing_description, price, cover_image_url, file_url, is_published, is_ai_generated",
        )
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (fetchError || !data) {
        setError("商品が見つかりません");
        setLoadingMaterial(false);
        return;
      }

      setTitle(data.title);
      setListingDescription(data.listing_description ?? "");
      setPrice(data.price != null ? String(data.price) : "");
      setIsPublished(data.is_published);
      setIsAiGenerated(data.is_ai_generated);
      if (data.cover_image_url) {
        setCoverImageUrl(data.cover_image_url);
        setPreviewUrl(data.cover_image_url);
      }
      if (data.file_url) {
        setFileUrl(data.file_url);
        setPdfFileName(getFileNameFromUrl(data.file_url));
      }
      setLoadingMaterial(false);
    }

    loadMaterial();
  }, [id, router]);

  function handlePdfChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setPdfFile(file);
    setPdfFileName(file.name);
  }

  async function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    setUploadStatus("カバー画像をアップロード中...");

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const url = await uploadFile(file, isAiGenerated ? undefined : "cover");
      setCoverImageUrl(url);
      setPreviewUrl(url);
    } catch (e) {
      setPreviewUrl(coverImageUrl || null);
      setError(
        e instanceof Error ? e.message : "画像のアップロードに失敗しました",
      );
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!userId) {
      setError("ログイン情報を取得できませんでした");
      setSubmitting(false);
      return;
    }

    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      setError("販売価格を正しく入力してください");
      setSubmitting(false);
      return;
    }

    try {
      let nextFileUrl = fileUrl;

      if (!isAiGenerated && pdfFile) {
        setUploading(true);
        setUploadStatus("PDFをアップロード中...");
        nextFileUrl = await uploadFile(pdfFile);
        setFileUrl(nextFileUrl);
        setUploading(false);
        setUploadStatus("");
      }

      const payload: Record<string, unknown> = {
        title,
        listingDescription,
        price: priceNumber,
        coverImageUrl,
      };

      if (!isAiGenerated) {
        if (!nextFileUrl) {
          setError("PDFファイルを選択してください");
          return;
        }
        payload.fileUrl = nextFileUrl;
      }

      const useUpdate = isPublished || !isAiGenerated;
      const res = await fetch(
        useUpdate ? `/api/material/${id}` : "/api/publish",
        {
          method: useUpdate ? "PUT" : "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(
            useUpdate ? payload : { materialId: id, ...payload },
          ),
        },
      );

      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "保存に失敗しました");
        return;
      }

      router.push(`/material/${id}`);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setUploading(false);
      setUploadStatus("");
      setSubmitting(false);
    }
  }

  const pageTitle = isAiGenerated
    ? isPublished
      ? "出品情報の編集"
      : "出品設定"
    : "PDF出品情報の編集";
  const submitLabel = isPublished || !isAiGenerated ? "変更を保存" : "出品する";

  return (
    <div className="min-h-screen bg-[#FDF2F7]">
      <Navbar />
      <main className="mx-auto max-w-2xl px-4 pt-20 pb-10">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">{pageTitle}</h1>
          <Link
            href="/dashboard"
            className="text-sm font-medium text-[#E91E63] underline-offset-4 hover:underline"
          >
            ダッシュボードへ
          </Link>
        </div>

        {loadingMaterial ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <p className="text-sm text-gray-500">読み込み中...</p>
          </div>
        ) : error && !title ? (
          <div className="rounded-lg bg-white p-8 text-center shadow-md">
            <p className="text-sm text-gray-600">{error}</p>
            <Link
              href="/dashboard"
              className="mt-4 inline-block text-sm font-medium text-[#E91E63] underline-offset-4 hover:underline"
            >
              ダッシュボードに戻る
            </Link>
          </div>
        ) : (
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
                placeholder={
                  isAiGenerated
                    ? "例）2024年11月に取得。試験形式は4択×50問。\nよく出るパターンを中心に予想問題を作成しました。"
                    : "取得時期・難易度・内容の説明など"
                }
                value={listingDescription}
                onChange={(e) => setListingDescription(e.target.value)}
                className={textareaClassName}
              />
            </div>

            {!isAiGenerated && (
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
                  onChange={handlePdfChange}
                  disabled={uploading || submitting}
                  className="w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#E91E63] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#C2185B]"
                />
                {pdfFileName && (
                  <p className="mt-2 text-sm text-gray-600">
                    {pdfFile ? "新しいファイル: " : "現在のファイル: "}
                    {pdfFileName}
                  </p>
                )}
              </div>
            )}

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
                placeholder={
                  isAiGenerated ? "例）500" : "0と入力すると無料になります"
                }
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className={inputClassName}
              />
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
                onChange={handleImageChange}
                disabled={uploading || submitting}
                className="w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-[#E91E63] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#C2185B]"
              />
              {(uploading || uploadStatus) && (
                <p className="mt-2 text-sm text-gray-500">
                  {uploadStatus || "アップロード中..."}
                </p>
              )}
              {coverImageUrl && !uploading && (
                <p className="mt-2 text-sm text-green-600">
                  画像のアップロードが完了しました
                </p>
              )}
              {previewUrl && (
                <img
                  src={previewUrl}
                  alt="カバー画像プレビュー"
                  className="mt-4 aspect-[16/9] w-full rounded-md object-cover"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || uploading}
              className={buttonClassName}
            >
              {uploading
                ? "アップロード中..."
                : submitting
                  ? "保存中..."
                  : submitLabel}
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
