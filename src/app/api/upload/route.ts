import { NextRequest, NextResponse } from 'next/server';
import { processFile, validateMultipleFiles, FileProcessingError, FILE_LIMITS } from '@/lib/fileProcessor';
import { vectorStore } from '@/lib/embeddings';

interface UploadResult {
  success: boolean;
  message: string;
  data?: {
    processedFiles: number;
    totalFiles: number;
    totalChunks: number;
    failedFiles: Array<{
      fileName: string;
      error: string;
      errorCode: string;
    }>;
    fileDetails: Array<{
      fileName: string;
      fileSize: number;
      fileType: string;
      pageCount?: number;
      sheetCount?: number;
    }>;
  };
  error?: {
    code: string;
    details?: string;
  };
}

export async function POST(request: NextRequest): Promise<NextResponse<UploadResult>> {
  console.log('📁 ファイルアップロード開始');
  
  try {
    // Content-Length チェック（大まかなサイズ制限）
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > FILE_LIMITS.MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: `アップロードサイズが制限を超えています（最大: ${formatFileSize(FILE_LIMITS.MAX_TOTAL_SIZE)}）`,
          error: { code: 'TOTAL_SIZE_EXCEEDED' }
        },
        { status: 413 }
      );
    }

    // FormData の解析
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          message: 'ファイルデータの解析に失敗しました',
          error: { code: 'INVALID_FORM_DATA' }
        },
        { status: 400 }
      );
    }

    const files = formData.getAll('files') as File[];
    console.log(`📄 受信ファイル数: ${files.length}`);

    // ファイル検証
    try {
      await validateMultipleFiles(files);
    } catch (error) {
      if (error instanceof FileProcessingError) {
        return NextResponse.json(
          {
            success: false,
            message: error.message,
            error: { 
              code: error.code,
              details: error.fileName 
            }
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // ファイル処理
    let processedFiles = 0;
    const failedFiles: Array<{ fileName: string; error: string; errorCode: string }> = [];
    const fileDetails: Array<{
      fileName: string;
      fileSize: number;
      fileType: string;
      pageCount?: number;
      sheetCount?: number;
    }> = [];

    for (const file of files) {
      console.log(`🔄 処理中: ${file.name} (${formatFileSize(file.size)})`);
      
      try {
        const result = await processFile(file);
        
        // ベクターストアに追加
        vectorStore.addDocuments(result.content, file.name, {
          ...result.metadata,
          uploadDate: new Date().toISOString(),
        });

        processedFiles++;
        fileDetails.push({
          fileName: result.metadata.fileName,
          fileSize: result.metadata.fileSize,
          fileType: result.metadata.fileType,
          pageCount: result.metadata.pageCount,
          sheetCount: result.metadata.sheetCount,
        });

        console.log(`✅ 処理完了: ${file.name}`);

      } catch (error) {
        console.error(`❌ 処理失敗: ${file.name}`, error);
        
        if (error instanceof FileProcessingError) {
          failedFiles.push({
            fileName: file.name,
            error: error.message,
            errorCode: error.code
          });
        } else {
          failedFiles.push({
            fileName: file.name,
            error: 'ファイル処理中に予期しないエラーが発生しました',
            errorCode: 'UNKNOWN_ERROR'
          });
        }
      }
    }

    // 結果の集計
    const status = vectorStore.getStatus();
    
    // レスポンス生成
    const hasFailures = failedFiles.length > 0;
    const allSucceeded = processedFiles === files.length;
    
    let message: string;
    if (allSucceeded) {
      message = `✅ ${processedFiles}個のファイルを正常に処理しました`;
    } else if (processedFiles > 0) {
      message = `⚠️ ${processedFiles}個のファイルを処理しました（${failedFiles.length}個失敗）`;
    } else {
      message = `❌ すべてのファイル処理に失敗しました`;
    }

    console.log(`📊 アップロード結果: 成功=${processedFiles}, 失敗=${failedFiles.length}`);

    return NextResponse.json(
      {
        success: processedFiles > 0,
        message,
        data: {
      processedFiles,
          totalFiles: files.length,
          totalChunks: status.chunkCount,
          failedFiles,
          fileDetails,
        }
      },
      { status: allSucceeded ? 200 : (processedFiles > 0 ? 207 : 400) }
    );

  } catch (error) {
    console.error('🚨 アップロード処理エラー:', error);
    
    return NextResponse.json(
      {
        success: false,
        message: 'ファイル処理中にシステムエラーが発生しました',
        error: { 
          code: 'SYSTEM_ERROR',
          details: error instanceof Error ? error.message : 'Unknown error'
        }
      },
      { status: 500 }
    );
  }
}

// Get endpoint for upload limits info
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    limits: {
      maxFileSize: FILE_LIMITS.MAX_FILE_SIZE,
      maxTotalSize: FILE_LIMITS.MAX_TOTAL_SIZE,
      supportedExtensions: FILE_LIMITS.SUPPORTED_EXTENSIONS,
      supportedMimeTypes: FILE_LIMITS.SUPPORTED_MIME_TYPES,
    },
    formatLimits: {
      maxFileSize: formatFileSize(FILE_LIMITS.MAX_FILE_SIZE),
      maxTotalSize: formatFileSize(FILE_LIMITS.MAX_TOTAL_SIZE),
    }
  });
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}