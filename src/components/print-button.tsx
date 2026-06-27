"use client";

import type { RefObject } from "react";

type PrintButtonProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
};

export function PrintButton({ iframeRef }: PrintButtonProps) {
  function handlePrint() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="rounded-full bg-[#E91E63] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C2185B]"
    >
      印刷する
    </button>
  );
}
