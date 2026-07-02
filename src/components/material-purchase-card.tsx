import { getMaterialPaymentInfo } from "@/lib/material-payment";

type MaterialPurchaseCardProps = {
  materialId: string;
  title: string;
  coverImageUrl: string | null;
  isAiGenerated: boolean;
  isPdfMaterial: boolean;
  pdfFileName: string | null;
  createdAtLabel: string;
  fallbackPrice: number | null;
  fallbackStripePaymentLink: string | null;
};

export async function MaterialPurchaseCard({
  materialId,
  title,
  coverImageUrl,
  isAiGenerated,
  isPdfMaterial,
  pdfFileName,
  createdAtLabel,
  fallbackPrice,
  fallbackStripePaymentLink,
}: MaterialPurchaseCardProps) {
  const payment = await getMaterialPaymentInfo(materialId, {
    price: fallbackPrice,
    stripePaymentLink: fallbackStripePaymentLink,
  });
  const price = payment?.price ?? 0;
  const stripePaymentLink = payment?.stripePaymentLink ?? "";

  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg">
      {/* 上半分：正方形の画像エリア */}
      <div className="relative w-full shrink-0" style={{ paddingTop: "100%" }}>
        {coverImageUrl ? (
          <img
            src={coverImageUrl}
            alt={title}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : (
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#f3f4f6",
              color: "#9ca3af",
              fontSize: "14px",
            }}
          >
            カバー画像なし
          </div>
        )}
      </div>

      {/* 下半分：価格・購入ボタン */}
      <div className="p-5">
        <p className="text-3xl font-bold text-gray-900">
          {price > 0 ? `¥${price.toLocaleString("ja-JP")}` : "無料"}
        </p>

        {stripePaymentLink ? (
          <a
            href={stripePaymentLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: "#a435f0" }}
            className="mt-4 block w-full rounded-lg px-4 py-3 text-center font-bold text-white hover:opacity-90"
          >
            ¥{price.toLocaleString("ja-JP")}で購入する
          </a>
        ) : (
          <button
            type="button"
            disabled
            className="mt-4 w-full cursor-not-allowed rounded-lg bg-gray-300 px-4 py-3 font-bold text-gray-500"
          >
            購入する（準備中）
          </button>
        )}

        {!stripePaymentLink && (
          <p className="mt-2 text-center text-xs text-gray-500">
            ※決済機能は準備中です
          </p>
        )}

        <hr className="my-5 border-gray-200" />

        <ul className="space-y-3 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span aria-hidden="true">📄</span>
            {isPdfMaterial ? "PDF教材" : "AI生成"}
          </li>
          {isAiGenerated && (
            <li className="flex items-center gap-2">
              <span aria-hidden="true">🖨️</span>
              印刷して使用可能
            </li>
          )}
          {isPdfMaterial && pdfFileName && (
            <li className="flex items-center gap-2">
              <span aria-hidden="true">📥</span>
              購入後にPDFダウンロード
            </li>
          )}
          <li className="flex items-center gap-2">
            <span aria-hidden="true">📅</span>
            作成日: {createdAtLabel}
          </li>
        </ul>
      </div>
    </div>
  );
}
