import type { Metadata } from "next";
import { Inter, Noto_Sans_JP } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  variable: "--font-noto",
  weight: ["400", "500", "700"],
});

export const metadata: Metadata = {
  title: "資格プラットフォーム",
  description: "資格学習プラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full">
      <body
        className={`${inter.variable} ${notoSansJP.variable} flex min-h-full flex-col font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
