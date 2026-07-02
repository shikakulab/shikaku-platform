"use client";

import Link from "next/link";

export function Navbar() {
  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b-[0.5px] border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-4 px-4">
        <Link
          href="/"
          className="shrink-0 text-[20px] font-medium text-[#DE2261] transition-opacity hover:opacity-80"
        >
          Studyフリマ
        </Link>

        <label className="min-w-0 flex-1">
          <span className="sr-only">検索</span>
          <input
            type="search"
            placeholder="資格名・キーワードで検索"
            className="h-[38px] w-full rounded-[20px] bg-gray-100 px-4 text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#DE2261]/20"
          />
        </label>

        <nav className="flex shrink-0 items-center gap-3 sm:gap-4">
          <Link
            href="/sell/new"
            className="hidden text-sm text-gray-700 transition-colors hover:text-[#DE2261] sm:inline"
          >
            出品する
          </Link>
          <Link
            href="/dashboard"
            className="text-sm text-gray-700 transition-colors hover:text-[#DE2261]"
          >
            ダッシュボード
          </Link>
          <Link
            href="/generate"
            className="rounded-2xl bg-[#DE2261] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#B81D52]"
          >
            問題集を作る
          </Link>
        </nav>
      </div>
    </header>
  );
}
