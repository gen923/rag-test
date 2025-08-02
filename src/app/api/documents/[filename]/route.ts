import { NextRequest, NextResponse } from 'next/server';
import { vectorStore } from '@/lib/embeddings';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const resolvedParams = await params;
    const filename = decodeURIComponent(resolvedParams.filename);
    console.log(`🗑️ ファイル削除開始: ${filename}`);
    
    // ベクターストアから削除前の状態を確認
    const beforeStatus = vectorStore.getStatus();
    const chunkCountBefore = vectorStore.getChunkCountBySource(filename);
    
    console.log(`削除前のチャンク数: ${chunkCountBefore}`);
    
    if (chunkCountBefore === 0) {
      return NextResponse.json({
        success: false,
        message: `${filename} は既に削除されているか、見つかりません`
      }, { status: 404 });
    }

    // ベクターストアから削除（メモリとファイル両方更新）
    const deleted = vectorStore.removeBySource(filename);

    if (!deleted) {
      return NextResponse.json({
        success: false,
        message: `${filename} の削除に失敗しました`
      }, { status: 400 });
    }

    // アップロードディレクトリからも物理ファイルを削除
    try {
      const uploadsDir = 'data/uploads';
      if (fs.existsSync(uploadsDir)) {
        const files = fs.readdirSync(uploadsDir);
        files.forEach(file => {
          if (file === filename) {
            const filePath = path.join(uploadsDir, file);
            fs.unlinkSync(filePath);
            console.log(`📁 物理ファイル削除: ${filePath}`);
          }
        });
      }
    } catch (fileError) {
      console.warn(`物理ファイル削除に失敗 (処理は続行): ${fileError}`);
    }

    // 削除後の状態を確認
    const afterStatus = vectorStore.getStatus();
    const deletedChunkCount = chunkCountBefore;

    console.log(`✅ 削除完了: ${filename}`);
    console.log(`削除されたチャンク数: ${deletedChunkCount}`);
    console.log(`残りファイル数: ${afterStatus.sources.length}`);
    console.log(`残りチャンク数: ${afterStatus.chunkCount}`);

    return NextResponse.json({
      success: true,
      message: `${filename} を削除しました！（${deletedChunkCount}チャンク削除）`,
      data: {
        deletedFile: filename,
        deletedChunks: deletedChunkCount,
        remainingFiles: afterStatus.sources.length,
        remainingChunks: afterStatus.chunkCount,
        remainingSources: afterStatus.sources
      }
    });

  } catch (error) {
    console.error('🚨 ファイル削除エラー:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'ファイル削除中にシステムエラーが発生しました',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}