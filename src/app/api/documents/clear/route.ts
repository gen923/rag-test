import { NextResponse } from 'next/server';
import { vectorStore } from '@/lib/embeddings';
import fs from 'fs';
import path from 'path';

export async function DELETE() {
  try {
    console.log('🗑️ 全ファイル削除開始...');
    
    // 削除前の状態を確認
    const beforeStatus = vectorStore.getStatus();
    console.log(`削除前: ${beforeStatus.sources.length}ファイル, ${beforeStatus.chunkCount}チャンク`);

    // ベクターストアから全削除（メモリとファイル両方更新）
    vectorStore.clearAll();

    // アップロードファイルディレクトリも空にする
    const uploadsDir = 'data/uploads';
    let deletedUploadFiles = 0;
    
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        if (file !== '.gitkeep') {
          try {
            fs.unlinkSync(path.join(uploadsDir, file));
            deletedUploadFiles++;
            console.log(`📁 物理ファイル削除: ${file}`);
          } catch (fileError) {
            console.warn(`物理ファイル削除失敗: ${file}`, fileError);
          }
        }
      });
    }
    
    // 削除後の状態を確認
    const afterStatus = vectorStore.getStatus();
    
    console.log('✅ 全削除完了');
    console.log(`削除されたファイル数: ${beforeStatus.sources.length}`);
    console.log(`削除されたチャンク数: ${beforeStatus.chunkCount}`);
    console.log(`削除された物理ファイル数: ${deletedUploadFiles}`);
    
    return NextResponse.json({ 
      success: true, 
      message: `すべてのファイルとデータを削除しました（${beforeStatus.sources.length}ファイル、${beforeStatus.chunkCount}チャンク）`,
      data: {
        deletedFiles: beforeStatus.sources.length,
        deletedChunks: beforeStatus.chunkCount,
        deletedUploadFiles: deletedUploadFiles,
        remainingFiles: afterStatus.sources.length,
        remainingChunks: afterStatus.chunkCount
      }
    });
    
  } catch (error) {
    console.error('🚨 全削除エラー:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: `ファイル削除中にシステムエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}` 
      },
      { status: 500 }
    );
  }
}
