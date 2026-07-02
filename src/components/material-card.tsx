"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MaterialCardProps = {
  id: string;
  title: string;
  certificationName: string;
  createdAtLabel: string;
  isPublished: boolean;
  isAiGenerated?: boolean;
};

export function MaterialCard({
  id,
  title,
  certificationName,
  createdAtLabel,
  isPublished,
  isAiGenerated = true,
}: MaterialCardProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    const confirmed = window.confirm(
      `「${title}」を削除しますか？\nこの操作は取り消せません。`,
    );
    if (!confirmed) return;

    setError(null);
    setDeleting(true);

    try {
      const res = await fetch(`/api/material/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setError(data.error ?? "削除に失敗しました");
        return;
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-md transition-shadow hover:shadow-lg">
      <Link href={`/material/${id}`} className="block">
        <h3 className="line-clamp-2 text-base font-semibold text-gray-900">
          {title}
        </h3>
        <p className="mt-2 text-sm text-[#DE2261]">{certificationName}</p>
        <p className="mt-3 text-xs text-gray-500">{createdAtLabel}</p>
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {isPublished ? (
          <>
            <span className="inline-block rounded-full bg-[#DE2261] px-3 py-1 text-xs font-medium text-white">
              出品中
            </span>
            <Link
              href={`/sell/${id}`}
              className="inline-block rounded-full border border-[#DE2261] px-3 py-1 text-xs font-medium text-[#DE2261] transition-colors hover:bg-[#DE2261] hover:text-white"
            >
              編集
            </Link>
          </>
        ) : (
          isAiGenerated && (
            <Link
              href={`/sell/${id}`}
              className="inline-block rounded-full border border-[#DE2261] px-4 py-1.5 text-sm font-medium text-[#DE2261] transition-colors hover:bg-[#DE2261] hover:text-white"
            >
              出品する
            </Link>
          )
        )}
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="inline-block rounded-full border border-gray-300 px-3 py-1 text-xs font-medium text-gray-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {deleting ? "削除中..." : "削除"}
        </button>
      </div>
      {error && (
        <p className="mt-2 text-xs text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
