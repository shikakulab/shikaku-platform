"use client";

import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { useEffect, useState } from "react";

export function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b border-[#F5C2D9] bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4">
        <Link
          href="/"
          className="shrink-0 text-xl font-bold text-[#E91E63] transition-opacity hover:opacity-80"
        >
          Studyフリマ
        </Link>

        <div className="hidden flex-1 justify-center md:flex">
          <label className="relative w-full max-w-md">
            <span className="sr-only">検索</span>
            <input
              type="search"
              placeholder="資格名・キーワードで検索"
              className="w-full rounded-full border border-[#F5C2D9] bg-[#FDF2F7] px-5 py-2.5 text-sm text-[#333333] placeholder:text-[#888888] focus:border-[#E91E63] focus:outline-none focus:ring-2 focus:ring-[#E91E63]/20"
            />
          </label>
        </div>

        <nav className="ml-auto flex shrink-0 items-center gap-3 sm:gap-4">
          {user ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-[#333333] transition-colors hover:text-[#E91E63]"
              >
                マイページ
              </Link>
              <Link
                href="/generate"
                className="rounded-full bg-[#E91E63] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C2185B]"
              >
                問題集を作る
              </Link>
            </>
          ) : (
            <>
              <Link
                href="/dashboard"
                className="hidden text-sm font-medium text-[#333333] transition-colors hover:text-[#E91E63] sm:inline"
              >
                出品する
              </Link>
              <Link
                href="/auth/login"
                className="text-sm font-medium text-[#333333] transition-colors hover:text-[#E91E63]"
              >
                ログイン
              </Link>
              <Link
                href="/auth/signup"
                className="rounded-full bg-[#E91E63] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C2185B]"
              >
                会員登録
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
