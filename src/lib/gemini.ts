import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateResponse(query: string, context: string): Promise<string> {
  if (!process.env.GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY が設定されていません');

  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt =
`[SYSTEM]
あなたはHRテクニカルアナリストです。丁寧で簡潔な日本語で、人が読みやすい形に整えて回答してください。
- 事実性: 参照に無い情報は推測しない。不明は「—」で表記。
- 構成は「要点 → キャリア要約 → 詳細プロファイル」のみ。参考/脚注/JSONは出力しない。
- セクション見出しは番号付きの見出し（Markdown見出し）で必ず出力する。
  例: "### 1. 要点" / "### 2. キャリア要約" / "### 3. 詳細プロファイル"
- リスト番号ではなく見出し番号を使うこと（"1) " や "1." の段落リストは使わない）。
- 重要語は**太字**、箇条書き中心。冗長な注釈は避ける。

[参照スニペット]
${context}

[ユーザー質問]
${query}

[出力仕様]
### 1. 要点（約5行）
- 候補者の現在の立ち位置・**役割/強み**（一文）
- **主要な活躍領域/技術**（文章で簡潔に）
- **稼働開始**: 値 / —
- **単価レンジ**: 値 / —
- **所属**: 値 / —

### 2. キャリア要約（約5行）
- 直近プロジェクト1: ドメイン / 役割 / 主要成果（1行）
- 直近プロジェクト2: 同上（1行）
- その前の経験: 担当範囲や技術の広がり（1行）
- 強みが活きた場面・再現性（1行）
- 今後の方向性（1行）

### 3. 詳細プロファイル（1名）
- 基本情報:
  - 氏名/イニシャル: 値 / —
  - 年齢: 値 / —
  - 性別: 値 / —
  - 最寄り駅: 値 / —
  - 稼働: 値 / —
  - 単価: 値 / —
  - 所属: 値 / —
- 技術:
  - 言語 / フレームワーク / クラウド / ツール（要点のみ）
- プロジェクト:
  - 箇条書き（各1行、要点のみ）
`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return '**❌ エラー**: APIキーが正しく設定されていません。.env.localを確認してください。';
      } else if (error.message.includes('404')) {
        return '**❌ エラー**: モデルが見つかりません。モデル名を確認してください。';
      }
    }
    return `**❌ エラー**: ${error instanceof Error ? error.message : 'もう一度お試しください。'}`;
  }
}

export async function generateSmallTalk(message: string): Promise<string> {
  if (!process.env.GOOGLE_API_KEY) throw new Error('GOOGLE_API_KEY が設定されていません');
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt =
`あなたは丁寧で親しみやすいアシスタントです。
- 雑談や挨拶には自然な日本語で簡潔に返す
- 必要なら「どのような情報をお探しですか？」と次の行動を促す
- RAGの人物分析は、ユーザーが意図を示した時だけ行う

ユーザー: ${message}
アシスタント:`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}
