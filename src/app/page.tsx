import { Navbar } from "@/components/navbar";
import { StarRating } from "@/components/star-rating";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

const CERTIFICATION_CATEGORIES = [
  {
    name: "法務・労務",
    items: ["司法試験", "行政書士試験", "社会保険労務士試験"],
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
    name: "金融",
    items: ["FP技能検定", "証券アナリスト"],
  },
  {
    name: "IT・データサイエンス",
    items: ["ITパスポート", "基本情報技術者", "AWS認定"],
  },
  {
    name: "語学",
    items: ["TOEIC", "英検", "TOEFL"],
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

export default async function Home() {
  const supabase = await createClient();
  const { data: materials } = await supabase
    .from("materials")
    .select(
      "id, title, certification_name, cover_image_url, price, created_at, reviews(rating)",
    )
    .eq("is_published", true);

  const items = ((materials ?? []) as MaterialRow[])
    .map(toPopularMaterial)
    .sort((a, b) => {
      if (b.reviewCount !== a.reviewCount) {
        return b.reviewCount - a.reviewCount;
      }
      return (
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    });

  return (
    <div className="min-h-screen bg-[#FDF2F7]">
      <Navbar />

      {/* ① ヒーローセクション */}
      <section className="bg-gradient-to-br from-[#E91E63] to-[#F06292] px-4 pt-24 pb-16 text-white">
        <div className="mx-auto max-w-[1200px] text-center">
          <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
            Studyフリマ
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
            資格保持者が作成・AIが生成した問題集で、効率よく合格を目指そう
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="#materials"
              className="inline-flex min-w-[180px] items-center justify-center rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#E91E63] transition-opacity hover:opacity-90"
            >
              問題集を探す
            </Link>
            <Link
              href="/generate"
              className="inline-flex min-w-[180px] items-center justify-center rounded-full border-2 border-white px-8 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              問題集を作る
            </Link>
          </div>
        </div>
      </section>

      <main className="mx-auto max-w-[1200px] px-4">
        {/* ② 資格カテゴリ一覧 */}
        <section className="py-16">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CERTIFICATION_CATEGORIES.map((category) => (
              <div
                key={category.name}
                className="overflow-hidden rounded-lg border border-gray-200"
              >
                <div className="bg-[#FF6B6B] px-4 py-3 text-sm font-bold text-white">
                  {category.name}
                </div>
                <ul className="bg-white">
                  {category.items.map((item) => (
                    <li key={item}>
                      <span className="block cursor-default px-4 py-2.5 text-sm text-gray-600 transition-colors hover:text-[#FF6B6B]">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* ③ 人気の問題集 */}
        <section id="materials" className="pb-16">
          <h2 className="mb-8 text-xl font-bold text-[#333333] sm:text-2xl">
            人気の問題集
          </h2>

          {items.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center rounded-xl bg-white py-16 shadow-sm">
              <p className="text-[#888888]">
                まだ出品されている問題集はありません
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {items.map((material) => (
                <Link
                  key={material.id}
                  href={`/material/${material.id}`}
                  className="group overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-md"
                >
                  {material.cover_image_url ? (
                    <img
                      src={material.cover_image_url}
                      alt={material.title}
                      className="aspect-[16/9] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/9] w-full items-center justify-center bg-gradient-to-br from-[#FF6B6B] to-[#FF8E8E] px-4">
                      <span className="text-center text-sm font-bold text-white sm:text-base">
                        {material.certification_name}
                      </span>
                    </div>
                  )}
                  <div className="p-4">
                    <h3 className="line-clamp-2 text-base font-bold text-[#333333] group-hover:text-[#FF6B6B]">
                      {material.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-500">
                      {material.certification_name}
                    </p>
                    {material.reviewCount > 0 && (
                      <div className="mt-2 flex items-center gap-1.5">
                        <StarRating
                          rating={material.averageRating}
                          size="sm"
                        />
                        <span className="text-xs text-gray-500">
                          ({material.reviewCount})
                        </span>
                      </div>
                    )}
                    <p className="mt-3 text-lg font-bold text-[#FF6B6B]">
                      {formatPrice(material.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
