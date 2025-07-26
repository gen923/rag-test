import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = decodeURIComponent(params.filename);
    console.log(`Deleting file: ${filename}`);
    
    // ベクターデータファイルのパス
    const vectorDbPath = 'data/vectors/chunks.json';
    
    // ベクターデータベースが存在するかチェック
    if (!fs.existsSync(vectorDbPath)) {
      return NextResponse.json(
        { success: false, message: 'ベクターデータベースが見つかりません' },
        { status: 404 }
      );
    }
    
    // アップロードディレクトリのファイルを削除
    const uploadsDir = 'data/uploads';
    if (fs.existsSync(uploadsDir)) {
      const files = fs.readdirSync(uploadsDir);
      files.forEach(file => {
        if (file === filename) {
          fs.unlinkSync(path.join(uploadsDir, file));
        }
      });
    }
    
    // ベクターデータベースから該当ファイルのチャンクを削除
    const chunks = JSON.parse(fs.readFileSync(vectorDbPath, 'utf8'));
    const filteredChunks = chunks.filter((chunk: any) => chunk.source !== filename);
    
    // 更新されたデータを保存
    fs.writeFileSync(vectorDbPath, JSON.stringify(filteredChunks, null, 2));
    
    return NextResponse.json({
      success: true,
      message: `${filename}のデータを削除しました！`
    });
    
  } catch (error) {
    console.error('Clear files error:', error);
    return NextResponse.json(
      { success: false, message: 'ファイル削除中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
