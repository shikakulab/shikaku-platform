"use client";

import { PrintButton } from "@/components/print-button";
import { useRef } from "react";

type MaterialPreviewProps = {
  html: string;
};

export function MaterialPreview({ html }: MaterialPreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  return (
    <div className="space-y-4">
      <iframe
        ref={iframeRef}
        title="問題集プレビュー"
        srcDoc={html}
        style={{ width: "100%", height: "80vh", border: "none" }}
      />
      <PrintButton iframeRef={iframeRef} />
    </div>
  );
}
