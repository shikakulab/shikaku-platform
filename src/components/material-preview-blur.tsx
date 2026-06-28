"use client";

type MaterialPreviewBlurProps = {
  html: string;
};

export function MaterialPreviewBlur({ html }: MaterialPreviewBlurProps) {
  return (
    <div className="relative h-[400px] overflow-hidden rounded-lg border border-gray-200 bg-white">
      <iframe
        title="問題集プレビュー"
        srcDoc={html}
        className="pointer-events-none h-[520px] w-full border-0"
        sandbox=""
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white via-white/90 to-transparent" />
    </div>
  );
}
