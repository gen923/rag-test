'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

interface FileUploadProps {
  onUploadComplete: () => void;
  theme: any;
}

export default function FileUpload({ onUploadComplete, theme }: FileUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>('');

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setUploadStatus('ファイルを処理中...');

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
        setUploadStatus(`✅ ${result.processedFiles}個のファイルを処理しました！`);
        onUploadComplete();
      } else {
        setUploadStatus(`❌ ${result.message}`);
      }

      setTimeout(() => setUploadStatus(''), 3000);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('❌ ファイルの処理に失敗しました');
      setTimeout(() => setUploadStatus(''), 3000);
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
    },
    multiple: true,
  });

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white mb-4">📁 ファイルアップロード</h3>
      
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-3xl p-8 text-center cursor-pointer transition-all duration-300 ${
          isDragActive
            ? `${theme.statusBorder.replace('border-', 'border-')} ${theme.statusBg} backdrop-blur-md scale-105`
            : 'border-white/30 hover:border-white/50 hover:bg-white/5'
        } ${isUploading ? 'pointer-events-none opacity-50' : ''}`}
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
            </div>
          )}
        </div>
      </div>

      {uploadStatus && (
        <div className={`p-4 rounded-2xl text-sm font-medium backdrop-blur-md border ${
          uploadStatus.startsWith('✅')
            ? 'bg-green-500/20 text-green-200 border-green-400/30'
            : uploadStatus.startsWith('❌')
            ? 'bg-red-500/20 text-red-200 border-red-400/30'
            : `${theme.statusBg} ${theme.statusText} ${theme.statusBorder}`
        }`}>
          {uploadStatus}
        </div>
      )}

      {isUploading && (
        <div className="flex items-center justify-center space-x-3 p-4">
          <div className="relative">
            <div className={`w-8 h-8 border-4 border-white/20 ${theme.statusBorder.replace('border-', 'border-t-')} rounded-full animate-spin`}></div>
          </div>
          <span className="text-sm text-gray-300 font-medium">処理中...</span>
        </div>
      )}
    </div>
  );
}
