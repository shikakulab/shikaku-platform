import { MaterialCard } from "@/components/material-card";
import { Navbar } from "@/components/navbar";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { redirect } from "next/navigation";

type Material = {
  id: string;
  title: string;
  certification_name: string;
  created_at: string;
  is_published: boolean;
  is_ai_generated: boolean;
};

function formatCreatedAt(dateString: string): string {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(dateString));
}

async function logout() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: materials } = await supabase
    .from("materials")
    .select("id, title, certification_name, created_at, is_published, is_ai_generated")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const items = (materials ?? []) as Material[];

  return (
    <div className="min-h-screen bg-[#FDF2F7]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-20 pb-10">
        <div className="mb-6 rounded-lg bg-white p-6 shadow-md">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                ダッシュボード
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                ログイン中: {user.email}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/generate"
                className="inline-flex items-center justify-center rounded-full bg-[#E91E63] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C2185B]"
              >
                新しい問題集を作る
              </Link>
              <Link
                href="/sell/new"
                className="inline-flex items-center justify-center rounded-full border border-[#E91E63] bg-white px-5 py-2.5 text-sm font-medium text-[#E91E63] transition-colors hover:bg-[#FDF2F7]"
              >
                PDFを出品する
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline"
                >
                  ログアウト
                </button>
              </form>
            </div>
          </div>
        </div>

        <section>
          <h2 className="mb-4 text-base font-semibold text-gray-900">
            過去の問題集
          </h2>

          {items.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center rounded-lg bg-white p-6 shadow-md">
              <p className="text-sm text-gray-500">
                まだ問題集がありません。さっそく作ってみましょう！
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((material) => (
                <MaterialCard
                  key={material.id}
                  id={material.id}
                  title={material.title}
                  certificationName={material.certification_name}
                  createdAtLabel={formatCreatedAt(material.created_at)}
                  isPublished={material.is_published}
                  isAiGenerated={material.is_ai_generated}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
