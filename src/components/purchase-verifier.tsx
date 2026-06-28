"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type PurchaseVerifierProps = {
  materialId: string;
};

export function PurchaseVerifier({ materialId }: PurchaseVerifierProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get("session_id");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) return;

    async function verifyPurchase() {
      setMessage("購入を確認しています...");

      try {
        const res = await fetch("/api/purchases/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ materialId, sessionId }),
        });

        const data = (await res.json()) as { error?: string };

        if (!res.ok) {
          setMessage(data.error ?? "購入の確認に失敗しました");
          return;
        }

        setMessage("購入が確認されました。レビューを投稿できます。");
        router.replace(`/material/${materialId}`);
        router.refresh();
      } catch (e) {
        setMessage(
          e instanceof Error ? e.message : "購入の確認に失敗しました",
        );
      }
    }

    verifyPurchase();
  }, [sessionId, materialId, router]);

  if (!sessionId && !message) {
    return null;
  }

  if (!message) {
    return null;
  }

  return (
    <div
      role="status"
      className="mx-auto mb-6 max-w-6xl rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800"
    >
      {message}
    </div>
  );
}
