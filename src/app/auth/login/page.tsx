"use client";

import { AuthCard } from "@/components/auth-card";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

const inputClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#E91E63] focus:outline-none focus:ring-1 focus:ring-[#E91E63]";

const buttonClassName =
  "w-full rounded-full bg-[#E91E63] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C2185B] disabled:cursor-not-allowed disabled:opacity-60";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthCard
      title="ログイン"
      alternateLink={{
        href: "/auth/signup",
        label: "アカウントをお持ちでない方は",
        linkText: "新規登録",
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
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
            htmlFor="email"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClassName}
          />
        </div>
        <div>
          <label
            htmlFor="password"
            className="mb-1 block text-sm font-medium text-gray-700"
          >
            パスワード
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClassName}
          />
        </div>
        <button type="submit" disabled={loading} className={buttonClassName}>
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
    </AuthCard>
  );
}
