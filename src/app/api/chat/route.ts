import { NextRequest, NextResponse } from 'next/server';
import { generateResponse } from '@/lib/gemini';
import { vectorStore } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== 'string') {
      return NextResponse.json(
        { message: 'メッセージが無効です' },
        { status: 400 }
      );
    }

    // 関連するチャンクを検索
    const relevantChunks = vectorStore.search(message, 3);

    // コンテキストを構築
    const context = relevantChunks.length > 0
      ? relevantChunks.map((chunk, index) => 
          `【参考情報${index + 1}】\n出典: ${chunk.source}\n内容: ${chunk.content}`
        ).join('\n\n')
      : '関連する情報が見つかりませんでした。一般的な情報でお答えします。';

    // Geminiで回答生成
    const response = await generateResponse(message, context);

    return NextResponse.json({
      message: response,
      sources: relevantChunks.map(chunk => ({
        source: chunk.source,
        content: chunk.content.substring(0, 100) + '...',
        id: chunk.id
      })),
      hasContext: relevantChunks.length > 0
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { message: 'チャット処理中にエラーが発生しました。もう一度お試しください。' },
      { status: 500 }
    );
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
