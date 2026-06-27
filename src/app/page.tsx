import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

type PublishedMaterial = {
  id: string;
  title: string;
  certification_name: string;
  cover_image_url: string | null;
  price: number | null;
};

const CATEGORIES = [
  "宅建士",
  "日商簿記",
  "TOEIC",
  "FP技能士",
  "AWS",
  "情報処理技術者",
] as const;

function formatPrice(price: number | null): string {
  const value = price ?? 0;
  return `¥${value.toLocaleString("ja-JP")}`;
}

export default async function Home() {
  const supabase = await createClient();
  const { data: materials } = await supabase
    .from("materials")
    .select("id, title, certification_name, cover_image_url, price")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const items = (materials ?? []) as PublishedMaterial[];

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
        {/* ② カテゴリセクション */}
        <section className="py-16">
          <h2 className="mb-8 text-xl font-bold text-[#333333] sm:text-2xl">
            人気の資格カテゴリ
          </h2>
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <span
                key={category}
                className="cursor-default rounded-full border border-[#E91E63] bg-white px-5 py-2 text-sm font-medium text-[#E91E63] transition-colors hover:bg-[#E91E63] hover:text-white"
              >
                {category}
              </span>
            ))}
          </div>
        </section>

        {/* ③ 問題集一覧セクション */}
        <section id="materials" className="pb-16">
          <h2 className="mb-8 text-xl font-bold text-[#333333] sm:text-2xl">
            新着の問題集
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
                  className="group overflow-hidden rounded-xl bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  {material.cover_image_url ? (
                    <img
                      src={material.cover_image_url}
                      alt={material.title}
                      className="aspect-square w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-square w-full items-center justify-center bg-gray-200 text-sm text-[#888888]">
                      No Image
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs font-medium text-[#E91E63]">
                      {material.certification_name}
                    </p>
                    <h3 className="mt-1 line-clamp-2 text-base font-bold text-[#333333] group-hover:text-[#E91E63]">
                      {material.title}
                    </h3>
                    <p className="mt-3 text-lg font-bold text-[#E91E63]">
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
