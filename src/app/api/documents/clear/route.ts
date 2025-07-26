import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE() {
  try {
    console.log('Clearing all files...'); // デバッグログ
    
    // ベクトルデータベースファイルのパス
    const vectorDbPath = 'data/vectors/chunks.json';
    
    // ファイルが存在する場合は削除
    if (fs.existsSync(vectorDbPath)) {
      fs.unlinkSync(vectorDbPath);
      console.log('Deleted vector database'); // デバッグログ
    }
    
    // アップロードファイルディレクトリも空にする（オプション）
    const uploadsDir = 'data/uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        if (file !== '.gitkeep') {
          fs.unlinkSync(path.join(uploadsDir, file));
          console.log(`Deleted upload file: ${file}`); // デバッグログ
        }
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'すべてのファイルとデータを削除しました' 
    });
  } catch (error) {
    console.error('Clear files error:', error);
    return NextResponse.json(
      { success: false, message: `ファイル削除中にエラーが発生しました: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
