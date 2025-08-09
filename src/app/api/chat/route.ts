import { NextRequest, NextResponse } from 'next/server';
import { generateResponse, generateSmallTalk } from '@/lib/gemini';
import { vectorStore } from '@/lib/embeddings';

// 挨拶/雑談・人物・プロフィール・基本情報・プロジェクトの判定
const greetRe     = /^(こん(にち|ばん)は|おはよう|やあ|hi|hello|hey)[!！。]?$/i;
const smalltalkRe = /(元気|天気|調子|ありがとう|雑談)/i;
const personRe    = /\b(y\.?s\.?|s\.?k\.?|ys|sk)\b/i;
const profileRe   = /(について|プロフィール|経歴|どんな人|紹介|概要)/i;
const basicRe     = /(最寄|駅|稼働|即日|参画|単価|万円|性別|男性|女性|年齢|歳|所属|株式会社)/i;
const projRe      = /(プロジェクト|案件|実績|成果|担当|フェーズ|役割|期間|pj)/i;

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ message: 'メッセージが無効です' }, { status: 400 });
    }
    const q = message.trim();
    const topK = 8;

    // 1) 雑談/挨拶 → 小さく自然に返す（RAGしない）
    if (greetRe.test(q) || smalltalkRe.test(q)) {
      const small = await generateSmallTalk(q);
      return NextResponse.json({ message: small, sources: [], hasContext: false });
    }

    // 2) RAGモードの意図判定
    const needPerson  = personRe.test(q);
    const needBasic   = basicRe.test(q);
    const needProj    = projRe.test(q);
    const needProfile = profileRe.test(q) || (needPerson && !needBasic && !needProj);

    // 3) 通常検索
    const base = vectorStore.search(q, topK);

    // 4) 必要に応じた追加検索
    const extra: any[] = [];

    // 1) プロフィール/基本情報 → 基本情報を必ず混ぜる
    if (needProfile || needBasic) {
      const basicKeywords = ['氏名','年齢','歳','性別','男性','女性','最寄','駅','稼働','即日','参画','単価','万円','所属','株式会社'];
      extra.push(...vectorStore.keywordSearch(basicKeywords, topK));
    }

    // 2) 人物補助（イニシャル/表記ゆれ）
    if (needPerson) {
      extra.push(...vectorStore.keywordSearch(['Y.S.','YS','S.K.','SK'], topK));
    }

    // 3) プロジェクト断片は プロジェクト質問 or プロフィール質問 で必ず混ぜる ← ここを変更
    if (needProj || needProfile) {
      extra.push(...vectorStore.keywordSearch(['プロジェクト','実績','成果','担当','フェーズ','役割','期間','PJ'], topK));
    }

    // 5) マージ（重複排除 → 上限）
    const seen = new Set<string>();
    const merged = [...extra, ...base].filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    }).slice(0, topK);

    if (merged.length === 0) {
      const small = await generateSmallTalk('簡単な自己紹介と、何をお手伝いできるかを案内してください');
      return NextResponse.json({ message: small, sources: [], hasContext: false });
    }

    const context = merged.map((chunk, i) =>
      `【参考情報${i + 1}】\n出典: ${chunk.source}\n内容: ${chunk.content}`
    ).join('\n\n');

    const response = await generateResponse(q, context);
    // 参考カードは返さない
    return NextResponse.json({ message: response, sources: [], hasContext: true });
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ message: 'チャット処理中にエラーが発生しました。' }, { status: 500 });
  }
}

// ヘルスチェック用のGETエンドポイント
export async function GET() {
  const status = vectorStore.getStatus();
  
  return NextResponse.json({
    status: 'ok',
    vectorStore: {
      chunkCount: status.chunkCount,
      sources: status.sources
    },
    timestamp: new Date().toISOString()
  });
}
