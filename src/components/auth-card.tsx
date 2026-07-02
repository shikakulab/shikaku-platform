import Link from "next/link";
import type { ReactNode } from "react";

export type AuthCardProps = {
  title: string;
  children: ReactNode;
  alternateLink: {
    href: string;
    label: string;
    linkText: string;
  };
};

export function AuthCard({ title, children, alternateLink }: AuthCardProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#FDF2F7] px-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <Link
          href="/"
          className="mb-6 block text-center text-2xl font-bold text-[#DE2261]"
        >
          Studyフリマ
        </Link>
        <h1 className="mb-6 text-center text-xl font-semibold text-gray-900">
          {title}
        </h1>
        {children}
        <p className="mt-6 text-center text-sm text-gray-600">
          {alternateLink.label}{" "}
          <Link
            href={alternateLink.href}
            className="font-medium text-[#DE2261] underline-offset-4 hover:underline"
          >
            {alternateLink.linkText}
          </Link>
        </p>
      </div>
    </div>
  );
}
