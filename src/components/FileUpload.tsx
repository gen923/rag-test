'use client';

import { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUploadComplete: () => void;
  theme: any;
}

interface UploadLimits {
  limits: {
    maxFileSize: number;
    maxTotalSize: number;
    supportedExtensions: string[];
    supportedMimeTypes: string[];
  };
  formatLimits: {
    maxFileSize: string;
    maxTotalSize: string;
  };
}

interface UploadProgress {
  status: 'idle' | 'validating' | 'uploading' | 'processing' | 'complete' | 'error';
  message: string;
  details?: {
    processedFiles: number;
    totalFiles: number;
    failedFiles: Array<{ fileName: string; error: string }>;
  };
}

export default function FileUpload({ onUploadComplete, theme }: FileUploadProps) {
  const [progress, setProgress] = useState<UploadProgress>({ status: 'idle', message: '' });
  const [limits, setLimits] = useState<UploadLimits | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  // アップロード制限を取得
  useEffect(() => {
    console.log('🔍 limits情報を取得中...');
    fetch('/api/upload')
      .then(res => {
        console.log('📡 API応答ステータス:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('📋 取得したlimits情報:', data);
        setLimits(data);
      })
      .catch(err => {
        console.error('❌ 制限情報の取得に失敗:', err);
      });
  }, []);

  const validateFiles = useCallback((files: File[]): { valid: boolean; error?: string } => {
    console.log('🔍 ファイル検証開始:', files.map(f => f.name));
    console.log('📊 limits状況:', limits);
    
    if (!limits) {
      console.log('⚠️ limits情報がまだ取得されていません');
      return { valid: true };
    }

    // ファイル数チェック
    if (files.length === 0) {
      return { valid: false, error: 'ファイルが選択されていません' };
    }

    // 個別ファイルサイズチェック
    for (const file of files) {
      if (file.size > limits.limits.maxFileSize) {
        return { 
          valid: false, 
          error: `"${file.name}" のサイズが制限を超えています（最大: ${limits.formatLimits.maxFileSize}）` 
        };
      }

      if (file.size === 0) {
        return { 
          valid: false, 
          error: `"${file.name}" は空のファイルです` 
        };
      }

      // 拡張子チェック
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (!extension || !limits.limits.supportedExtensions.includes(extension)) {
        return { 
          valid: false, 
          error: `"${file.name}" はサポートされていない形式です` 
        };
      }
    }

    // 合計サイズチェック
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > limits.limits.maxTotalSize) {
      return { 
        valid: false, 
        error: `合計ファイルサイズが制限を超えています（最大: ${limits.formatLimits.maxTotalSize}）` 
      };
    }

    return { valid: true };
  }, [limits]);

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    console.log('📁 ファイルドロップ:', { accepted: acceptedFiles.length, rejected: rejectedFiles.length });
    
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(r => r.errors[0]?.message || 'Unknown error').join(', ');
      setProgress({ 
        status: 'error', 
        message: `❌ ファイル形式エラー: ${errors}` 
      });
      setTimeout(() => setProgress({ status: 'idle', message: '' }), 5000);
      return;
    }

    if (acceptedFiles.length === 0) return;

    setSelectedFiles(acceptedFiles);

    // ファイル検証
    setProgress({ status: 'validating', message: 'ファイルを検証中...' });
    
    const validation = validateFiles(acceptedFiles);
    if (!validation.valid) {
      setProgress({ 
        status: 'error', 
        message: `❌ ${validation.error}` 
      });
      setTimeout(() => setProgress({ status: 'idle', message: '' }), 5000);
      return;
    }

    // アップロード開始
    setProgress({ status: 'uploading', message: `📤 ${acceptedFiles.length}個のファイルをアップロード中...` });

    try {
      const formData = new FormData();
      acceptedFiles.forEach(file => {
        formData.append('files', file);
      });

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        const details = result.data;
        let message = `✅ ${details.processedFiles}個のファイルを処理しました！`;
        
        if (details.failedFiles.length > 0) {
          message = `⚠️ ${details.processedFiles}個成功、${details.failedFiles.length}個失敗`;
        }

        setProgress({ 
          status: 'complete', 
          message,
          details 
        });
        
        onUploadComplete();
      } else {
        setProgress({ 
          status: 'error', 
          message: `❌ ${result.message}`,
          details: result.data 
        });
      }

      setTimeout(() => {
        setProgress({ status: 'idle', message: '' });
        setSelectedFiles([]);
      }, 5000);

    } catch (error) {
      console.error('🚨 アップロードエラー:', error);
      setProgress({ 
        status: 'error', 
        message: '❌ ネットワークエラーが発生しました' 
      });
      setTimeout(() => setProgress({ status: 'idle', message: '' }), 5000);
    }
  }, [validateFiles, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt']
    },
    maxSize: limits?.limits?.maxFileSize || 10 * 1024 * 1024,
    multiple: true
  });

  const isProcessing = ['validating', 'uploading', 'processing'].includes(progress.status);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">📁 ファイルアップロード</h3>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? `${theme.statusBorder.replace('border-', 'border-')} ${theme.statusBg} backdrop-blur-md scale-105`
            : 'border-white/30 hover:border-white/50 hover:bg-white/5'
        } ${isProcessing ? 'pointer-events-none opacity-50' : ''}`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="text-6xl">📄</div>
          {isDragActive ? (
            <p className={`font-medium ${theme.statusText}`}>ファイルをドロップしてください</p>
          ) : (
            <div className="space-y-2">
              <p className="text-white font-medium">
                Excel/PDFファイルをドラッグ&ドロップ
              </p>
              <p className="text-sm text-gray-300">
                または クリックしてファイルを選択
              </p>
              <div className="flex justify-center space-x-2 mt-3">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-gray-300">.xlsx</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-gray-300">.xls</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-gray-300">.pdf</span>
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs text-gray-300">.txt</span>
              </div>
              
              {limits && (
                <div className="mt-4 space-y-1">
                  <p className="text-xs text-gray-400">
                    📏 最大ファイルサイズ: {limits.formatLimits.maxFileSize}
                  </p>
                  <p className="text-xs text-gray-400">
                    📦 最大合計サイズ: {limits.formatLimits.maxTotalSize}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 選択されたファイル一覧 */}
      {selectedFiles.length > 0 && progress.status === 'idle' && (
        <div className="bg-white/10 rounded-2xl p-4">
          <h4 className="text-sm font-medium text-white mb-2">選択されたファイル:</h4>
          <div className="space-y-1">
            {selectedFiles.map((file, index) => (
              <div key={index} className="flex justify-between items-center text-xs text-gray-300">
                <span className="truncate">{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ステータス表示 */}
      {progress.message && (
        <div className={`p-4 rounded-2xl text-sm font-medium backdrop-blur-md border ${
          progress.status === 'complete'
            ? 'bg-green-500/20 text-green-200 border-green-400/30'
            : progress.status === 'error'
            ? 'bg-red-500/20 text-red-200 border-red-400/30'
            : `${theme.statusBg} ${theme.statusText} ${theme.statusBorder}`
        }`}>
          <div>{progress.message}</div>
          
          {/* 詳細情報 */}
          {progress.details && (
            <div className="mt-2 space-y-1">
              {progress.details.failedFiles.map((failed, index) => (
                <div key={index} className="text-xs opacity-80">
                  ❌ {failed.fileName}: {failed.error}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* プログレス表示 */}
      {isProcessing && (
        <div className="flex items-center justify-center space-x-3 p-4">
          <div className="relative">
            <div className={`w-8 h-8 border-4 border-white/20 ${theme.statusBorder.replace('border-', 'border-t-')} rounded-full animate-spin`}></div>
          </div>
          <span className="text-sm text-gray-300 font-medium">
            {progress.status === 'validating' && '検証中...'}
            {progress.status === 'uploading' && 'アップロード中...'}
            {progress.status === 'processing' && '処理中...'}
          </span>
        </div>
      )}
    </div>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
}
