"use client";

import { useState } from "react";

const TABS = [
  "すべて",
  "IT・データ",
  "不動産",
  "経営・会計",
  "語学",
  "金融",
] as const;

export function CategoryTabBar() {
  const [active, setActive] = useState<string>("すべて");

  return (
    <div className="flex gap-1 overflow-x-auto border-b border-gray-200">
      {TABS.map((tab) => (
        <button
          key={tab}
          type="button"
          onClick={() => setActive(tab)}
          className={`shrink-0 px-4 py-3 text-sm font-medium transition-colors ${
            active === tab
              ? "border-b-2 border-[#DE2261] text-[#DE2261]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
