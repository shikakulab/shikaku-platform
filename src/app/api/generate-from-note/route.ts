import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `あなたは資格試験の問題集を作成する専門家です。
ユーザーが撮影した自作の勉強ノートを分析し、
そのノートの内容をもとにオリジナルの予想問題を3問作成してください。

【重要：著作権への配慮】
- 市販の教科書や問題集の内容をそのまま再現しない
- ノートから読み取った知識をもとに、完全オリジナルの問題を作成する
- 問題の表現・構成はすべてオリジナルにする

【出力形式の厳守事項】
- 純粋なHTMLのみを出力する
- マークダウン、コードブロック、説明文は一切含めない
- Webナビゲーション、ボタン、リンクは一切含めない
- A4印刷に最適化したレイアウト
- CSSは<style>タグに記述する
- 問題数はちょうど3問

【HTMLテンプレート構造】
<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<style>
  @page { size: A4; margin: 20mm; }
  @media print { body { margin: 0; } .page-break { page-break-before: always; } }
  body { font-family: "Noto Sans JP", sans-serif; font-size: 11pt; line-height: 1.8; color: #1a1a1a; max-width: 170mm; margin: 0 auto; padding: 10mm; }
  h1 { font-size: 16pt; text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 4mm; margin-bottom: 8mm; }
  h2 { font-size: 13pt; background: #f0f0f0; padding: 2mm 4mm; margin-top: 8mm; }
  .question { margin: 4mm 0; }
  .question-number { font-weight: bold; }
  .choices { margin-left: 6mm; }
  .answer-section { margin-top: 15mm; border-top: 1px dashed #999; padding-top: 5mm; }
</style>
</head>
<body>
  <!-- 問題集タイトル -->
  <!-- 問題セクション -->
  <!-- 解答セクション -->
</body>
</html>`;

const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

type GenerateFromNoteBody = {
  imageBase64: string;
  imageMediaType: string;
  certName: string;
  additionalNote: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function assertBody(body: unknown): GenerateFromNoteBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid JSON body");
  }
  const b = body as Partial<GenerateFromNoteBody>;
  if (!isNonEmptyString(b.imageBase64)) {
    throw new Error("Missing imageBase64");
  }
  if (!isNonEmptyString(b.imageMediaType)) {
    throw new Error("Missing imageMediaType");
  }
  if (!ALLOWED_MEDIA_TYPES.has(b.imageMediaType)) {
    throw new Error("Unsupported imageMediaType");
  }
  if (!isNonEmptyString(b.certName)) {
    throw new Error("Missing certName");
  }
  return {
    imageBase64: b.imageBase64.trim(),
    imageMediaType: b.imageMediaType.trim(),
    certName: b.certName.trim(),
    additionalNote:
      typeof b.additionalNote === "string" ? b.additionalNote.trim() : "",
  };
}

export async function POST(request: Request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing ANTHROPIC_API_KEY" },
        { status: 500 },
      );
    }

    const body = assertBody(await request.json());

    const anthropic = new Anthropic({ apiKey });
    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: body.imageMediaType as
                  | "image/jpeg"
                  | "image/png"
                  | "image/gif"
                  | "image/webp",
                data: body.imageBase64,
              },
            },
            {
              type: "text",
              text: `試験名：${body.certName}\n補足：${body.additionalNote}\n\n上記のノート画像を分析して、予想問題集HTMLを生成してください。`,
            },
          ],
        },
      ],
    });

    const html = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return NextResponse.json({ html });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
