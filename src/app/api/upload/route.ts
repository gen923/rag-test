import { NextRequest, NextResponse } from 'next/server';
import { processFile } from '@/lib/fileProcessor';
import { vectorStore } from '@/lib/embeddings';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ファイルが選択されていません' },
        { status: 400 }
      );
    }

    let processedFiles = 0;

    for (const file of files) {
      try {
        const content = await processFile(file);
        // addDocumentsは同期メソッドなのでawaitは不要
        vectorStore.addDocuments(content, file.name, {
          uploadDate: new Date().toISOString(),
          fileSize: file.size,
          fileType: file.type
        });
        processedFiles++;
      } catch (error) {
        console.error(`ファイル処理エラー (${file.name}):`, error);
        // エラーがあっても処理を続行
      }
    }

    const status = vectorStore.getStatus();

    return NextResponse.json({
      success: true,
      message: `${processedFiles}個のファイルを処理しました`,
      totalChunks: status.chunkCount,
      processedFiles,
      totalFiles: files.length
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'ファイル処理中にエラーが発生しました' },
      { status: 500 }
    );
  }
}