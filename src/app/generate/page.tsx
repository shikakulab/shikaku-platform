"use client";

import { Navbar } from "@/components/navbar";
import { useMemo, useRef, useState } from "react";

type Tab = "text" | "note";

type GenerateResponse =
  | { html: string }
  | {
      error: string;
    };

type SaveResponse =
  | { success: true; materialId: string }
  | { error: string };

const inputClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder:text-gray-400 focus:border-[#DE2261] focus:outline-none focus:ring-1 focus:ring-[#DE2261]";

const textareaClassName = `${inputClassName} resize-y`;

const buttonClassName =
  "w-full rounded-full bg-[#DE2261] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#B81D52] disabled:cursor-not-allowed disabled:opacity-60";

function fileToBase64(
  file: File,
): Promise<{ base64: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Failed to read image"));
        return;
      }
      const commaIndex = result.indexOf(",");
      if (commaIndex === -1) {
        reject(new Error("Invalid image data"));
        return;
      }
      const header = result.slice(0, commaIndex);
      const base64 = result.slice(commaIndex + 1);
      const mediaType =
        header.match(/data:(.*);base64/)?.[1] ?? file.type ?? "image/jpeg";
      resolve({ base64, mediaType });
    };
    reader.onerror = () => reject(new Error("Failed to read image"));
    reader.readAsDataURL(file);
  });
}

export default function GeneratePage() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<Tab>("text");

  const [certName, setCertName] = useState("");
  const [certLevel, setCertLevel] = useState("");
  const [keyPoints, setKeyPoints] = useState("");
  const [predictedQuestions, setPredictedQuestions] = useState("");

  const [noteImage, setNoteImage] = useState<File | null>(null);
  const [noteImagePreview, setNoteImagePreview] = useState<string | null>(null);
  const [noteCertName, setNoteCertName] = useState("");
  const [noteAdditional, setNoteAdditional] = useState("");

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [html, setHtml] = useState<string | null>(null);
  const [generatedCertName, setGeneratedCertName] = useState("");

  const canSubmitText = useMemo(() => {
    return (
      certName.trim() &&
      certLevel.trim() &&
      keyPoints.trim() &&
      predictedQuestions.trim() &&
      !loading
    );
  }, [certName, certLevel, keyPoints, predictedQuestions, loading]);

  const canSubmitNote = useMemo(() => {
    return noteImage && noteCertName.trim() && !loading;
  }, [noteImage, noteCertName, loading]);

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (noteImagePreview) {
      URL.revokeObjectURL(noteImagePreview);
    }

    setNoteImage(file);
    setNoteImagePreview(URL.createObjectURL(file));
  }

  function clearNoteImage() {
    if (noteImagePreview) {
      URL.revokeObjectURL(noteImagePreview);
    }
    setNoteImage(null);
    setNoteImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleTextSubmit(event: React.FormEvent<HTMLFormElement>) {
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

      setGeneratedCertName(certName);
      setHtml(data.html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function handleNoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!noteImage) return;

    setError(null);
    setSaveError(null);
    setHtml(null);
    setLoading(true);

    try {
      const { base64, mediaType } = await fileToBase64(noteImage);

      const res = await fetch("/api/generate-from-note", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          imageMediaType: mediaType,
          certName: noteCertName,
          additionalNote: noteAdditional,
        }),
      });

      const data = (await res.json()) as GenerateResponse;

      if (!res.ok) {
        setError("error" in data ? data.error : "Failed to generate");
        return;
      }

      if (!("html" in data) || !data.html) {
        setError("生成結果が空でした。別の画像で再度お試しください。");
        return;
      }

      setGeneratedCertName(noteCertName);
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
          certName: generatedCertName,
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
            <div className="mb-6 flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab("text")}
                className={`px-4 pb-3 text-sm font-medium transition-colors ${
                  activeTab === "text"
                    ? "border-b-2 border-[#DE2261] text-[#DE2261]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                テキストで作成
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("note")}
                className={`px-4 pb-3 text-sm font-medium transition-colors ${
                  activeTab === "note"
                    ? "border-b-2 border-[#DE2261] text-[#DE2261]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                ノートから作成
              </button>
            </div>

            {activeTab === "text" ? (
              <form onSubmit={handleTextSubmit} className="space-y-4">
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
                  disabled={!canSubmitText}
                  className={buttonClassName}
                >
                  {loading
                    ? "生成中...（30秒ほどかかります）"
                    : "問題集を生成する"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleNoteSubmit} className="space-y-4">
                {error && (
                  <p
                    role="alert"
                    className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
                  >
                    {error}
                  </p>
                )}

                <div className="rounded-md border border-[#DE2261] bg-[#FFF3CD] px-4 py-3 text-sm leading-relaxed text-gray-800">
                  ⚠️ 注意：市販の教科書・参考書・問題集の写真アップロードは禁止です。
                  ご自身が作成した手書きノートのみアップロードしてください。
                  違反した場合はアカウントを停止します。
                </div>

                <div>
                  <label
                    htmlFor="noteImage"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    ノート画像（1枚）
                  </label>
                  <input
                    ref={fileInputRef}
                    id="noteImage"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-md file:border-0 file:bg-[#DE2261] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-[#e85555]"
                  />
                  {noteImagePreview && (
                    <div className="relative mt-3">
                      <img
                        src={noteImagePreview}
                        alt="ノート画像プレビュー"
                        className="max-w-full rounded-md border border-gray-300"
                      />
                      <button
                        type="button"
                        onClick={clearNoteImage}
                        className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-gray-800/80 text-sm font-bold text-white transition-colors hover:bg-gray-900"
                        aria-label="画像をクリア"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="noteCertName"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    試験名
                  </label>
                  <input
                    id="noteCertName"
                    type="text"
                    placeholder="例）日本化粧品検定2級"
                    value={noteCertName}
                    onChange={(e) => setNoteCertName(e.target.value)}
                    className={inputClassName}
                  />
                </div>

                <div>
                  <label
                    htmlFor="noteAdditional"
                    className="mb-1 block text-sm font-medium text-gray-700"
                  >
                    補足（任意）
                  </label>
                  <textarea
                    id="noteAdditional"
                    placeholder="例）この単元の問題を多めに作ってください"
                    rows={3}
                    value={noteAdditional}
                    onChange={(e) => setNoteAdditional(e.target.value)}
                    className={textareaClassName}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canSubmitNote}
                  className={buttonClassName}
                >
                  {loading
                    ? "ノートを分析中...（30秒ほどかかります）"
                    : "問題集を生成する"}
                </button>
              </form>
            )}
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
