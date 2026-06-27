"use client";

import { Navbar } from "@/components/navbar";
import { useMemo, useRef, useState } from "react";

type GenerateResponse =
  | { html: string }
  | {
      error: string;
    };

type SaveResponse =
  | { success: true; materialId: string }
  | { error: string };

const inputClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#E91E63] focus:outline-none focus:ring-1 focus:ring-[#E91E63]";

const textareaClassName = `${inputClassName} resize-y`;

const buttonClassName =
  "w-full rounded-full bg-[#E91E63] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#C2185B] disabled:cursor-not-allowed disabled:opacity-60";

export default function GeneratePage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const [certName, setCertName] = useState("");
  const [certLevel, setCertLevel] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [predictedQuestions, setPredictedQuestions] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return (
      certName.trim() &&
      certLevel.trim() &&
      keyPoints.trim() &&
      predictedQuestions.trim() &&
      !loading
    );
  }, [certName, certLevel, keyPoints, predictedQuestions, loading]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSaveError(null);
    setHtml(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          certName,
          certLevel,
          keyPoints,
          predictedQuestions,
        }),
      });

      const data = (await res.json()) as GenerateResponse;

      if (!res.ok) {
        setError("error" in data ? data.error : "Failed to generate");
        return;
      }

      if (!("html" in data) || !data.html) {
        setError("生成結果が空でした。入力内容を変えて再度お試しください。");
        return;
      }

      setHtml(data.html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.focus();
    win.print();
  }

  async function handleSave() {
    if (!html) return;

    const title = window.prompt("問題集のタイトルを入力してください");
    if (!title?.trim()) return;

    setSaveError(null);
    setSaving(true);

    try {
      const res = await fetch("/api/save", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          certName,
          generatedHtml: html,
        }),
      });

      const data = (await res.json()) as SaveResponse;

      if (!res.ok) {
        setSaveError("error" in data ? data.error : "保存に失敗しました");
        return;
      }

      alert("保存しました！");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#FDF2F7]">
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 pt-20 pb-10">
        <p className="mb-6 text-sm text-gray-600">
          実際の試験問題の丸写しは入力しないでください。あなた自身の言葉で対策ポイントや予想問題を記入してください。
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-4 text-base font-semibold text-gray-900">
              入力フォーム
            </h2>

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
                  htmlFor="certName"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  試験名
                </label>
                <input
                  id="certName"
                  type="text"
                  placeholder="例）宅建士、TOEIC、AWS SAA"
                  value={certName}
                  onChange={(e) => setCertName(e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="certLevel"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  級・難易度
                </label>
                <input
                  id="certLevel"
                  type="text"
                  placeholder="例）2級、スコア700以上"
                  value={certLevel}
                  onChange={(e) => setCertLevel(e.target.value)}
                  className={inputClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="keyPoints"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  重要単元・対策すべきポイント
                </label>
                <textarea
                  id="keyPoints"
                  placeholder="例）民法の相続と不法行為は毎年出る。数字の暗記が必須。"
                  rows={6}
                  value={keyPoints}
                  onChange={(e) => setKeyPoints(e.target.value)}
                  className={textareaClassName}
                />
              </div>

              <div>
                <label
                  htmlFor="predictedQuestions"
                  className="mb-1 block text-sm font-medium text-gray-700"
                >
                  予想問題（自由記述）
                </label>
                <textarea
                  id="predictedQuestions"
                  placeholder="例）相続放棄の期限を問う問題、AとBが〜の場合どうなるか形式など"
                  rows={6}
                  value={predictedQuestions}
                  onChange={(e) => setPredictedQuestions(e.target.value)}
                  className={textareaClassName}
                />
              </div>

              <button
                type="submit"
                disabled={!canSubmit}
                className={buttonClassName}
              >
                {loading ? "生成中...（30秒ほどかかります）" : "問題集を生成する"}
              </button>
            </form>
          </section>

          <section className="rounded-lg bg-white p-6 shadow-md">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-gray-900">
                プレビュー
              </h2>
              {html && (
                <button
                  type="button"
                  onClick={handlePrint}
                  className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                >
                  印刷する
                </button>
              )}
            </div>

            {html ? (
              <>
                <iframe
                  ref={iframeRef}
                  title="preview"
                  className="h-[75vh] w-full rounded-md border border-gray-200 bg-white"
                  srcDoc={html}
                />
                <div className="mt-4 space-y-2">
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className={buttonClassName}
                  >
                    {saving ? "保存中..." : "保存する"}
                  </button>
                  {saveError && (
                    <p
                      role="alert"
                      className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                    >
                      {saveError}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-[75vh] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
                生成結果がここに表示されます
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
