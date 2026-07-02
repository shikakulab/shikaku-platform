import { CategoryTabBar } from "@/components/category-tab-bar";
import { Navbar } from "@/components/navbar";
import { StarRating } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const CERTIFICATION_CATEGORIES = [
  {
    name: "IT・データサイエンス",
    items: ["ITパスポート", "基本情報技術者", "AWS認定"],
  },
  {
    name: "不動産",
    items: ["宅建士試験", "マンション管理士試験", "不動産鑑定士試験"],
  },
  {
    name: "経営・会計",
    items: ["日商簿記", "中小企業診断士", "公認会計士"],
  },
  {
    name: "語学",
    items: ["TOEIC", "英検", "TOEFL"],
  },
  {
    name: "金融",
    items: ["FP技能検定", "証券アナリスト", "貸金業務取扱主任者"],
  },
  {
    name: "法務・労務",
    items: ["行政書士試験", "社会保険労務士", "司法書士試験"],
  },
] as const;

type ReviewRating = {
  rating: number;
};

type MaterialRow = {
  id: string;
  title: string;
  certification_name: string;
  cover_image_url: string | null;
  price: number | null;
  created_at: string;
  reviews: ReviewRating[];
};

type PopularMaterial = MaterialRow & {
  reviewCount: number;
  averageRating: number;
};

function formatPrice(price: number | null): string {
  const value = price ?? 0;
  return `¥${value.toLocaleString("ja-JP")}`;
}

function toPopularMaterial(material: MaterialRow): PopularMaterial {
  const reviews = material.reviews ?? [];
  const reviewCount = reviews.length;
  const averageRating =
    reviewCount > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
      : 0;

  return { ...material, reviewCount, averageRating };
}

function getThumbnailGradient(certificationName: string): string {
  const name = certificationName.toLowerCase();

  if (
    /itパスポート|基本情報|aws|データサイエンス|情報処理|プログラミング|python|java/.test(
      name,
    )
  ) {
    return "linear-gradient(135deg, #4A90D9, #78B4F0)";
  }

  if (
    /宅建|マンション|不動産|行政書士|社会保険|司法|法務|労務|司法書士/.test(
      name,
    )
  ) {
    return "linear-gradient(135deg, #E05050, #FF8C8C)";
  }

  if (/簿記|診断士|会計士|経営/.test(name)) {
    return "linear-gradient(135deg, #52B76B, #7FD496)";
  }

  if (/toeic|英検|toefl|語学|英語/.test(name)) {
    return "linear-gradient(135deg, #9B59B6, #C39BD3)";
  }

  return "linear-gradient(135deg, #E05050, #FF7878)";
}

export default async function Home() {
  const supabase = await createClient();
  const { data: materials } = await supabase
    .from("materials")
    .select(
      "id, title, certification_name, cover_image_url, price, created_at, reviews(rating)",
    )
    .eq("is_published", true)
    .order("created_at", { ascending: false })
    .limit(12);

  const items = ((materials ?? []) as MaterialRow[]).map(toPopularMaterial);

  return (
    <div className="min-h-screen bg-[#FFF5F5]">
      <Navbar />

      {/* ① ヒーローセクション */}
      <section
        className="pt-14 text-white"
        style={{
          background: "linear-gradient(135deg, #E05050 0%, #FF7878 100%)",
          padding: "40px 32px",
        }}
      >
        <div className="mx-auto max-w-[1200px] text-center">
          <h1 className="text-2xl font-bold leading-snug sm:text-3xl lg:text-4xl">
            合格者の知識から生まれた、本物の予想問題集
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            資格保持者がAIと共に作成した問題集で、効率よく合格を目指そう
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="#materials"
              className="inline-flex min-w-[160px] items-center justify-center rounded-2xl bg-white px-6 py-2.5 text-sm font-medium text-[#E05050] transition-opacity hover:opacity-90"
            >
              問題集を探す
            </Link>
            <Link
              href="/generate"
              className="inline-flex min-w-[160px] items-center justify-center rounded-2xl border border-white px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              無料で問題集を作る
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-4">
        {/* ② タブバー */}
        <section className="pt-6">
          <CategoryTabBar />
        </section>

        {/* ③ カテゴリセクション */}
        <section className="py-10">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="shrink-0 text-base font-bold text-gray-900 sm:text-lg">
              資格カテゴリから探す
            </h2>
            <div className="h-px flex-1 bg-gray-200" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {CERTIFICATION_CATEGORIES.map((category) => (
              <div
                key={category.name}
                className="overflow-hidden rounded-lg border-[0.5px] border-gray-200 bg-white"
              >
                <div
                  className="bg-[#E05050] px-2.5 py-1.5 text-[11px] font-medium text-white"
                  style={{ padding: "6px 10px" }}
                >
                  {category.name}
                </div>
                <ul>
                  {category.items.map((item) => (
                    <li key={item}>
                      <span className="flex cursor-default items-center justify-between px-3 py-2.5 text-sm text-gray-700 transition-colors hover:bg-gray-50 hover:text-[#E05050]">
                        <span>{item}</span>
                        <span className="text-xs text-gray-400">&gt;</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ④ 人気の問題集 */}
        <section id="materials" className="pb-12">
          <h2 className="mb-6 text-base font-bold text-gray-900 sm:text-lg">
            人気の問題集
          </h2>

          {items.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-[10px] border-[0.5px] border-gray-200 bg-white py-16">
              <p className="text-sm text-gray-500">
                まだ出品されている問題集はありません
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((material) => (
                <Link
                  key={material.id}
                  href={`/material/${material.id}`}
                  className="group overflow-hidden rounded-[10px] border-[0.5px] border-gray-200 bg-white transition-shadow hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)]"
                >
                  {material.cover_image_url ? (
                    <img
                      src={material.cover_image_url}
                      alt={material.title}
                      className="h-[120px] w-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-[120px] w-full items-center justify-center px-3"
                      style={{
                        background: getThumbnailGradient(
                          material.certification_name,
                        ),
                      }}
                    >
                      <span className="text-center text-xs font-medium text-white sm:text-sm">
                        {material.certification_name}
                      </span>
                    </div>
                  )}
                  <div style={{ padding: "10px 12px" }}>
                    <p className="text-[10px] text-[#E05050]">
                      {material.certification_name}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-xs font-medium text-gray-900">
                      {material.title}
                    </h3>
                    {material.reviewCount > 0 && (
                      <div className="mt-1.5 flex items-center gap-1">
                        <StarRating
                          rating={material.averageRating}
                          size="sm"
                        />
                        <span className="text-[10px] text-gray-500">
                          ({material.reviewCount})
                        </span>
                      </div>
                    )}
                    <p className="mt-1.5 text-sm font-medium text-[#E05050]">
                      {formatPrice(material.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* ⑤ フッター */}
      <footer className="border-t border-gray-200 bg-gray-50 py-6">
        <div className="mx-auto max-w-[1200px] px-4 text-center text-xs text-gray-500">
          <p>© 2026 Studyフリマ</p>
          <p className="mt-2">
            <span className="cursor-default hover:text-gray-700">利用規約</span>
            <span className="mx-2">·</span>
            <span className="cursor-default hover:text-gray-700">
              プライバシーポリシー
            </span>
          </p>
        </div>
      </footer>
    </div>
  );
}
