import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `あなたは資格試験の問題集を作成する専門家です。
ユーザーが提供した対策ポイントと予想問題をもとに、
実際の試験に近い「オリジナル予想問題集」をHTML形式で生成してください。

【重要】著作権への配慮
- 実際の試験問題を再現するのではなく、同じ知識を問うオリジナルの問題を作成する
- 問題の表現・構成はすべてオリジナルにする

【出力形式の厳守事項】
- 純粋なHTMLのみを出力する。マークダウン、コードブロック、説明文は一切含めない
- Webナビゲーション、ボタン、リンクは一切含めない
- A4印刷に最適化したレイアウト
- CSSは<style>タグに記述する
- 問題数はちょうど3問のみ生成すること。それ以上でも以下でもない。

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
  <!-- 問題セクション（単元ごとにh2で区切る） -->
  <!-- 改ページ -->
  <!-- 解答・解説セクション -->
</body>
</html>`;

type GenerateRequestBody = {
  certName: string;
  certLevel: string;
  keyPoints: string;
  predictedQuestions: string;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function assertBody(body: unknown): GenerateRequestBody {
  if (typeof body !== "object" || body === null) {
    throw new Error("Invalid JSON body");
  }
  const b = body as Partial<GenerateRequestBody>;
  if (
    !isNonEmptyString(b.certName) ||
    !isNonEmptyString(b.certLevel) ||
    !isNonEmptyString(b.keyPoints) ||
    !isNonEmptyString(b.predictedQuestions)
  ) {
    throw new Error("Missing required fields");
  }
  return {
    certName: b.certName,
    certLevel: b.certLevel,
    keyPoints: b.keyPoints,
    predictedQuestions: b.predictedQuestions,
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
    const userPrompt = [
      `試験名: ${body.certName}`,
      `級・難易度: ${body.certLevel}`,
      "",
      "重要単元・対策すべきポイント:",
      body.keyPoints,
      "",
      "予想問題（自由記述）:",
      body.predictedQuestions,
      "",
      "上記をもとに、要件を満たすHTMLを出力してください。",
    ].join("\n");

    const message = await anthropic.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
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

