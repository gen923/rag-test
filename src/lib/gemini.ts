import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);

export async function generateResponse(query: string, context: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
あなたは経験豊富なHRテクニカルアナリストです。スキルシートデータを分析し、構造化された見やすい回答を提供してください。

【重要な指針】
1. 回答は必ずMarkdown形式で構造化する
2. 見出し、箇条書き、表を適切に使用する
3. 具体的な数値、名前、スキルレベルを必ず含める
4. 情報をカテゴリごとに整理して表示する

【参考データ】
${context}

【質問】
${query}

【回答形式】必ず以下のMarkdown形式で回答してください：

## 📊 検索結果概要
- **該当人数**: X名
- **主要スキル**: [具体的なスキル一覧]

## 👥 エンジニア詳細情報

### 🔹 [エンジニア名] （年齢・性別）
**基本情報**
- 最寄り駅: [駅名]
- 稼働: [稼働状況]
- 単価: [単価情報]

**技術スキル**
- 言語: [プログラミング言語]
- フレームワーク: [使用フレームワーク]
- クラウド: [クラウド経験]

**プロジェクト経験**
- [具体的なプロジェクト内容]
- [実績・成果]

---

## 💡 推奨事項
[質問の目的に応じた具体的なアドバイス]

**注意**: データが不足している場合は「追加で○○の情報があれば詳細分析可能」と記載してください。
`;

  try {
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('GOOGLE_API_KEY が設定されていません');
    }

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return '**❌ エラー**: APIキーが正しく設定されていません。.env.localファイルを確認してください。';
      } else if (error.message.includes('404')) {
        return '**❌ エラー**: モデルが見つかりません。Geminiのモデル名を確認してください。';
      }
    }
    
    return `**❌ エラー**: ${error instanceof Error ? error.message : 'もう一度お試しください。'}`;
  }
}
