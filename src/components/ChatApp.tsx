'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import FileUpload from './FileUpload';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{
    source: string;
    content: string;
    id: string;
  }>;
}

type Theme = 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'dark' | 'red' | 'cyan' | 'teal' | 'indigo' | 'violet' | 'emerald' | 'amber' | 'rose' | 'sky' | 'lime' | 'fuchsia' | 'yellow' | 'slate' | 'warm';

const themes = {
  purple: {
    name: '🟣 パープル',
    bg: 'bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900',
    primary: 'from-blue-500 to-purple-600',
    primaryHover: 'from-blue-600 to-purple-700',
    accent: 'text-purple-200',
    secondary: 'text-blue-200',
    userBg: 'bg-gradient-to-r from-blue-500 to-purple-600',
    statusBg: 'from-blue-500/20 to-purple-500/20',
    statusBorder: 'border-blue-400/30',
    statusText: 'text-blue-200',
    shadow: 'shadow-blue-500/25',
    shadowHover: 'shadow-blue-500/40',
  },
  blue: {
    name: '🔵 ブルー',
    bg: 'bg-gradient-to-br from-slate-900 via-blue-900 to-cyan-900',
    primary: 'from-blue-500 to-cyan-500',
    primaryHover: 'from-blue-600 to-cyan-600',
    accent: 'text-cyan-200',
    secondary: 'text-blue-200',
    userBg: 'bg-gradient-to-r from-blue-500 to-cyan-500',
    statusBg: 'from-blue-500/20 to-cyan-500/20',
    statusBorder: 'border-cyan-400/30',
    statusText: 'text-cyan-200',
    shadow: 'shadow-cyan-500/25',
    shadowHover: 'shadow-cyan-500/40',
  },
  green: {
    name: '🟢 グリーン',
    bg: 'bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900',
    primary: 'from-emerald-500 to-teal-500',
    primaryHover: 'from-emerald-600 to-teal-600',
    accent: 'text-teal-200',
    secondary: 'text-emerald-200',
    userBg: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    statusBg: 'from-emerald-500/20 to-teal-500/20',
    statusBorder: 'border-teal-400/30',
    statusText: 'text-teal-200',
    shadow: 'shadow-teal-500/25',
    shadowHover: 'shadow-teal-500/40',
  },
  orange: {
    name: '🟠 オレンジ',
    bg: 'bg-gradient-to-br from-slate-900 via-orange-900 to-red-900',
    primary: 'from-orange-500 to-red-500',
    primaryHover: 'from-orange-600 to-red-600',
    accent: 'text-orange-200',
    secondary: 'text-red-200',
    userBg: 'bg-gradient-to-r from-orange-500 to-red-500',
    statusBg: 'from-orange-500/20 to-red-500/20',
    statusBorder: 'border-red-400/30',
    statusText: 'text-orange-200',
    shadow: 'shadow-red-500/25',
    shadowHover: 'shadow-red-500/40',
  },
  pink: {
    name: '🩷 ピンク',
    bg: 'bg-gradient-to-br from-slate-900 via-pink-900 to-rose-900',
    primary: 'from-pink-500 to-rose-500',
    primaryHover: 'from-pink-600 to-rose-600',
    accent: 'text-rose-200',
    secondary: 'text-pink-200',
    userBg: 'bg-gradient-to-r from-pink-500 to-rose-500',
    statusBg: 'from-pink-500/20 to-rose-500/20',
    statusBorder: 'border-rose-400/30',
    statusText: 'text-pink-200',
    shadow: 'shadow-rose-500/25',
    shadowHover: 'shadow-rose-500/40',
  },
  dark: {
    name: '⚫ ダーク',
    bg: 'bg-gradient-to-br from-gray-900 via-slate-900 to-zinc-900',
    primary: 'from-gray-600 to-slate-600',
    primaryHover: 'from-gray-700 to-slate-700',
    accent: 'text-gray-200',
    secondary: 'text-slate-200',
    userBg: 'bg-gradient-to-r from-gray-600 to-slate-600',
    statusBg: 'from-gray-500/20 to-slate-500/20',
    statusBorder: 'border-slate-400/30',
    statusText: 'text-gray-200',
    shadow: 'shadow-slate-500/25',
    shadowHover: 'shadow-slate-500/40',
  },
  red: {
    name: '🔴 レッド',
    bg: 'bg-gradient-to-br from-slate-900 via-red-900 to-pink-900',
    primary: 'from-red-500 to-pink-500',
    primaryHover: 'from-red-600 to-pink-600',
    accent: 'text-pink-200',
    secondary: 'text-red-200',
    userBg: 'bg-gradient-to-r from-red-500 to-pink-500',
    statusBg: 'from-red-500/20 to-pink-500/20',
    statusBorder: 'border-pink-400/30',
    statusText: 'text-red-200',
    shadow: 'shadow-red-500/25',
    shadowHover: 'shadow-red-500/40',
  },
  cyan: {
    name: '🩵 シアン',
    bg: 'bg-gradient-to-br from-slate-900 via-cyan-900 to-sky-900',
    primary: 'from-cyan-500 to-sky-500',
    primaryHover: 'from-cyan-600 to-sky-600',
    accent: 'text-sky-200',
    secondary: 'text-cyan-200',
    userBg: 'bg-gradient-to-r from-cyan-500 to-sky-500',
    statusBg: 'from-cyan-500/20 to-sky-500/20',
    statusBorder: 'border-sky-400/30',
    statusText: 'text-cyan-200',
    shadow: 'shadow-cyan-500/25',
    shadowHover: 'shadow-cyan-500/40',
  },
  teal: {
    name: '🧿 ティール',
    bg: 'bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900',
    primary: 'from-teal-500 to-emerald-500',
    primaryHover: 'from-teal-600 to-emerald-600',
    accent: 'text-emerald-200',
    secondary: 'text-teal-200',
    userBg: 'bg-gradient-to-r from-teal-500 to-emerald-500',
    statusBg: 'from-teal-500/20 to-emerald-500/20',
    statusBorder: 'border-emerald-400/30',
    statusText: 'text-teal-200',
    shadow: 'shadow-teal-500/25',
    shadowHover: 'shadow-teal-500/40',
  },
  indigo: {
    name: '💙 インディゴ',
    bg: 'bg-gradient-to-br from-slate-900 via-indigo-900 to-blue-900',
    primary: 'from-indigo-500 to-blue-500',
    primaryHover: 'from-indigo-600 to-blue-600',
    accent: 'text-blue-200',
    secondary: 'text-indigo-200',
    userBg: 'bg-gradient-to-r from-indigo-500 to-blue-500',
    statusBg: 'from-indigo-500/20 to-blue-500/20',
    statusBorder: 'border-blue-400/30',
    statusText: 'text-indigo-200',
    shadow: 'shadow-indigo-500/25',
    shadowHover: 'shadow-indigo-500/40',
  },
  violet: {
    name: '💜 バイオレット',
    bg: 'bg-gradient-to-br from-slate-900 via-violet-900 to-purple-900',
    primary: 'from-violet-500 to-purple-500',
    primaryHover: 'from-violet-600 to-purple-600',
    accent: 'text-purple-200',
    secondary: 'text-violet-200',
    userBg: 'bg-gradient-to-r from-violet-500 to-purple-500',
    statusBg: 'from-violet-500/20 to-purple-500/20',
    statusBorder: 'border-purple-400/30',
    statusText: 'text-violet-200',
    shadow: 'shadow-violet-500/25',
    shadowHover: 'shadow-violet-500/40',
  },
  emerald: {
    name: '💚 エメラルド',
    bg: 'bg-gradient-to-br from-slate-900 via-emerald-900 to-green-900',
    primary: 'from-emerald-500 to-green-500',
    primaryHover: 'from-emerald-600 to-green-600',
    accent: 'text-green-200',
    secondary: 'text-emerald-200',
    userBg: 'bg-gradient-to-r from-emerald-500 to-green-500',
    statusBg: 'from-emerald-500/20 to-green-500/20',
    statusBorder: 'border-green-400/30',
    statusText: 'text-emerald-200',
    shadow: 'shadow-emerald-500/25',
    shadowHover: 'shadow-emerald-500/40',
  },
  amber: {
    name: '🟡 アンバー',
    bg: 'bg-gradient-to-br from-slate-900 via-amber-900 to-orange-900',
    primary: 'from-amber-500 to-orange-500',
    primaryHover: 'from-amber-600 to-orange-600',
    accent: 'text-orange-200',
    secondary: 'text-amber-200',
    userBg: 'bg-gradient-to-r from-amber-500 to-orange-500',
    statusBg: 'from-amber-500/20 to-orange-500/20',
    statusBorder: 'border-orange-400/30',
    statusText: 'text-amber-200',
    shadow: 'shadow-amber-500/25',
    shadowHover: 'shadow-amber-500/40',
  },
  rose: {
    name: '🌹 ローズ',
    bg: 'bg-gradient-to-br from-slate-900 via-rose-900 to-red-900',
    primary: 'from-rose-500 to-red-500',
    primaryHover: 'from-rose-600 to-red-600',
    accent: 'text-red-200',
    secondary: 'text-rose-200',
    userBg: 'bg-gradient-to-r from-rose-500 to-red-500',
    statusBg: 'from-rose-500/20 to-red-500/20',
    statusBorder: 'border-red-400/30',
    statusText: 'text-rose-200',
    shadow: 'shadow-rose-500/25',
    shadowHover: 'shadow-rose-500/40',
  },
  sky: {
    name: '🌤️ スカイ',
    bg: 'bg-gradient-to-br from-slate-900 via-sky-900 to-blue-900',
    primary: 'from-sky-500 to-blue-500',
    primaryHover: 'from-sky-600 to-blue-600',
    accent: 'text-blue-200',
    secondary: 'text-sky-200',
    userBg: 'bg-gradient-to-r from-sky-500 to-blue-500',
    statusBg: 'from-sky-500/20 to-blue-500/20',
    statusBorder: 'border-blue-400/30',
    statusText: 'text-sky-200',
    shadow: 'shadow-sky-500/25',
    shadowHover: 'shadow-sky-500/40',
  },
  lime: {
    name: '🟢 ライム',
    bg: 'bg-gradient-to-br from-slate-900 via-lime-900 to-green-900',
    primary: 'from-lime-500 to-green-500',
    primaryHover: 'from-lime-600 to-green-600',
    accent: 'text-green-200',
    secondary: 'text-lime-200',
    userBg: 'bg-gradient-to-r from-lime-500 to-green-500',
    statusBg: 'from-lime-500/20 to-green-500/20',
    statusBorder: 'border-green-400/30',
    statusText: 'text-lime-200',
    shadow: 'shadow-lime-500/25',
    shadowHover: 'shadow-lime-500/40',
  },
  fuchsia: {
    name: '💖 フューシャ',
    bg: 'bg-gradient-to-br from-slate-900 via-fuchsia-900 to-pink-900',
    primary: 'from-fuchsia-500 to-pink-500',
    primaryHover: 'from-fuchsia-600 to-pink-600',
    accent: 'text-pink-200',
    secondary: 'text-fuchsia-200',
    userBg: 'bg-gradient-to-r from-fuchsia-500 to-pink-500',
    statusBg: 'from-fuchsia-500/20 to-pink-500/20',
    statusBorder: 'border-pink-400/30',
    statusText: 'text-fuchsia-200',
    shadow: 'shadow-fuchsia-500/25',
    shadowHover: 'shadow-fuchsia-500/40',
  },
  yellow: {
    name: '🟨 イエロー',
    bg: 'bg-gradient-to-br from-slate-900 via-yellow-800 to-amber-900',
    primary: 'from-yellow-500 to-amber-500',
    primaryHover: 'from-yellow-600 to-amber-600',
    accent: 'text-amber-200',
    secondary: 'text-yellow-200',
    userBg: 'bg-gradient-to-r from-yellow-500 to-amber-500',
    statusBg: 'from-yellow-500/20 to-amber-500/20',
    statusBorder: 'border-amber-400/30',
    statusText: 'text-yellow-200',
    shadow: 'shadow-yellow-500/25',
    shadowHover: 'shadow-yellow-500/40',
  },
  slate: {
    name: '⚪ スレート',
    bg: 'bg-gradient-to-br from-slate-900 via-slate-800 to-gray-900',
    primary: 'from-slate-500 to-gray-500',
    primaryHover: 'from-slate-600 to-gray-600',
    accent: 'text-gray-200',
    secondary: 'text-slate-200',
    userBg: 'bg-gradient-to-r from-slate-500 to-gray-500',
    statusBg: 'from-slate-500/20 to-gray-500/20',
    statusBorder: 'border-gray-400/30',
    statusText: 'text-slate-200',
    shadow: 'shadow-slate-500/25',
    shadowHover: 'shadow-slate-500/40',
  },
  warm: {
    name: '🔥 ウォーム',
    bg: 'bg-gradient-to-br from-orange-900 via-red-900 to-pink-900',
    primary: 'from-orange-500 to-pink-500',
    primaryHover: 'from-orange-600 to-pink-600',
    accent: 'text-pink-200',
    secondary: 'text-orange-200',
    userBg: 'bg-gradient-to-r from-orange-500 to-pink-500',
    statusBg: 'from-orange-500/20 to-pink-500/20',
    statusBorder: 'border-pink-400/30',
    statusText: 'text-orange-200',
    shadow: 'shadow-orange-500/25',
    shadowHover: 'shadow-orange-500/40',
  },
};

export default function ChatApp() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [documentsLoaded, setDocumentsLoaded] = useState(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [currentTheme, setCurrentTheme] = useState<Theme>('purple');
  const [showAllThemes, setShowAllThemes] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [deletingFiles, setDeletingFiles] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const theme = themes[currentTheme];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkSystemStatus = async () => {
    try {
      // キャッシュを避けるためにタイムスタンプを追加
      const response = await fetch(`/api/chat?t=${Date.now()}`);
      const status = await response.json();
      setSystemStatus(status);
      setDocumentsLoaded(status.vectorStore.chunkCount > 0);
      console.log('System status updated:', status); // デバッグ用
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  useEffect(() => {
    checkSystemStatus();
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: input })
      });

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        sources: data.sources || []
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。'
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // チャット履歴をクリア
  const clearChatHistory = () => {
    if (messages.length === 0) return;
    
    if (window.confirm('チャット履歴をすべて削除しますか？この操作は元に戻せません。')) {
      setMessages([]);
    }
  };

  // すべてのファイルを削除
  const clearUploadedFiles = async () => {
    if (!documentsLoaded) return;
    
    if (window.confirm('アップロードしたファイルをすべて削除しますか？この操作は元に戻せません。')) {
      setIsClearing(true);
      try {
        const response = await fetch('/api/documents/clear', {
          method: 'DELETE',
        });

        if (response.ok) {
          setDocumentsLoaded(false);
          setSystemStatus(null);
          // 関連するチャットも削除するか確認
          if (messages.length > 0 && window.confirm('関連するチャット履歴も削除しますか？')) {
            setMessages([]);
          }
        } else {
          alert('ファイル削除に失敗しました。');
        }
      } catch (error) {
        console.error('Clear files error:', error);
        alert('ファイル削除中にエラーが発生しました。');
      } finally {
        setIsClearing(false);
      }
    }
  };

  // 個別ファイルを削除
  const deleteSpecificFile = async (filename: string) => {
    if (window.confirm(`"${filename}" を削除しますか？この操作は元に戻せません。`)) {
      setDeletingFiles(prev => new Set(prev).add(filename));
      
      try {
        const response = await fetch(`/api/documents/${encodeURIComponent(filename)}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          const result = await response.json();
          
          // システム状態を強制更新
          await checkSystemStatus();
          
          // 少し待ってから再度更新（確実にするため）
          setTimeout(async () => {
            await checkSystemStatus();
          }, 500);
          
          // 削除したファイルに関連するチャットメッセージがある場合の処理
          const relatedMessages = messages.filter(msg => 
            msg.sources?.some(source => source.source === filename)
          );
          
          if (relatedMessages.length > 0 && 
              window.confirm(`"${filename}" に関連する${relatedMessages.length}件のチャットメッセージも削除しますか？`)) {
            setMessages(prev => prev.filter(msg => 
              !msg.sources?.some(source => source.source === filename)
            ));
          }
          
          // 成功メッセージを表示
          alert(result.message || `"${filename}" を削除しました！`);
        } else {
          const errorData = await response.json();
          alert(`ファイル削除に失敗しました: ${errorData.message}`);
        }
      } catch (error) {
        console.error('Delete file error:', error);
        alert('ファイル削除中にエラーが発生しました。');
      } finally {
        setDeletingFiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(filename);
          return newSet;
        });
      }
    }
  };

  return (
    <div className={`flex h-screen transition-all duration-500 ${theme.bg}`}>
      {/* サイドバー */}
      <div className="w-80 bg-white/10 backdrop-blur-xl border-r border-white/20 p-6 overflow-y-auto">
        {/* ヘッダー */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <div className={`w-10 h-10 bg-gradient-to-r ${theme.primary} rounded-xl flex items-center justify-center`}>
              <span className="text-white text-xl font-bold">🤖</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">RAG AI Assistant</h1>
              <p className="text-sm text-gray-300">スキルシート分析</p>
            </div>
          </div>
        </div>

        {/* テーマ選択 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white">🎨 テーマ選択</h3>
            <button
              onClick={() => setShowAllThemes(!showAllThemes)}
              className="text-xs text-gray-300 hover:text-white transition-colors"
            >
              {showAllThemes ? '折りたたむ' : 'すべて表示'}
            </button>
          </div>
          
          <div className={`grid grid-cols-2 gap-2 transition-all duration-300 ${
            showAllThemes ? 'max-h-96 overflow-y-auto' : 'max-h-32 overflow-hidden'
          }`}>
            {Object.entries(themes).map(([key, themeOption]) => (
              <button
                key={key}
                onClick={() => {
                  setCurrentTheme(key as Theme);
                  if (!showAllThemes) setShowAllThemes(false);
                }}
                className={`p-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                  currentTheme === key
                    ? `bg-gradient-to-r ${themeOption.primary} text-white shadow-lg ${themeOption.shadow}`
                    : 'bg-white/10 text-gray-300 hover:bg-white/20'
                }`}
              >
                {themeOption.name}
              </button>
            ))}
          </div>
        </div>
        
        <FileUpload onUploadComplete={() => {
          setDocumentsLoaded(true);
          checkSystemStatus();
        }} theme={theme} />
        
        {/* システム状態 */}
        <div className="mt-6 space-y-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center space-x-2 mb-2">
              <div className={`w-3 h-3 rounded-full ${documentsLoaded ? 'bg-green-400' : 'bg-yellow-400'} animate-pulse`}></div>
              <p className="text-sm font-semibold text-white">システム状態</p>
            </div>
            <p className="text-sm text-gray-300">
              {documentsLoaded ? '✨ 準備完了' : '⏳ ファイル待ち'}
            </p>
            {systemStatus && (
              <p className="text-xs text-gray-400 mt-1">
                チャンク数: {systemStatus.vectorStore?.chunkCount || 0}
              </p>
            )}
          </div>
          
          {/* ファイル一覧と個別削除 */}
          {systemStatus?.vectorStore?.sources?.length > 0 && (
            <div className={`bg-gradient-to-r ${theme.statusBg} backdrop-blur-md rounded-2xl p-4 border ${theme.statusBorder}`}>
              <div className="flex items-center justify-between mb-3">
                <p className={`text-sm font-semibold ${theme.statusText}`}>📁 読み込み済みファイル</p>
                <span className="text-xs text-gray-400">
                  {systemStatus.vectorStore.sources.length}件
                </span>
              </div>
              
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {systemStatus.vectorStore.sources.map((source: string, idx: number) => (
                  <div key={idx} className="flex items-center justify-between bg-white/10 rounded-lg p-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className={`w-1.5 h-1.5 ${theme.statusText.replace('text-', 'bg-')} rounded-full flex-shrink-0`}></div>
                      <span className={`text-xs ${theme.statusText} truncate`} title={source}>
                        {source}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => deleteSpecificFile(source)}
                      disabled={deletingFiles.has(source)}
                      className="ml-2 flex-shrink-0 w-6 h-6 bg-red-500/20 hover:bg-red-500/40 rounded-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      title={`"${source}" を削除`}
                    >
                      {deletingFiles.has(source) ? (
                        <div className="w-3 h-3 border border-red-400 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <span className="text-red-300 text-xs">×</span>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* クリア・削除ボタン */}
          <div className="space-y-3">
            {/* チャット履歴クリアボタン */}
            <button
              onClick={clearChatHistory}
              disabled={messages.length === 0}
              className="w-full bg-white/10 hover:bg-red-500/20 disabled:bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-red-400/30 disabled:border-white/10 transition-all duration-200 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-center space-x-2">
                <span className="text-lg">🗑️</span>
                <span className={`text-sm font-medium ${messages.length > 0 ? 'text-white group-hover:text-red-200' : 'text-gray-500'}`}>
                  チャット履歴をクリア
                </span>
              </div>
              {messages.length > 0 && (
                <p className="text-xs text-gray-400 mt-1">
                  {messages.length}件のメッセージ
                </p>
              )}
            </button>

            {/* すべてのファイル削除ボタン */}
            <button
              onClick={clearUploadedFiles}
              disabled={!documentsLoaded || isClearing}
              className="w-full bg-white/10 hover:bg-red-500/20 disabled:bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/20 hover:border-red-400/30 disabled:border-white/10 transition-all duration-200 disabled:cursor-not-allowed group"
            >
              <div className="flex items-center justify-center space-x-2">
                {isClearing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-red-400 rounded-full animate-spin"></div>
                    <span className="text-sm font-medium text-gray-300">すべて削除中...</span>
                  </>
                ) : (
                  <>
                    <span className="text-lg">📂</span>
                    <span className={`text-sm font-medium ${documentsLoaded ? 'text-white group-hover:text-red-200' : 'text-gray-500'}`}>
                      すべてのファイルを削除
                    </span>
                  </>
                )}
              </div>
              {documentsLoaded && !isClearing && (
                <p className="text-xs text-gray-400 mt-1">
                  {systemStatus?.vectorStore?.sources?.length || 0}ファイル一括削除
                </p>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* メインチャットエリア - 前回と同じコードを使用 */}
      <div className="flex-1 flex flex-col">
        {/* メッセージエリア */}
        <div className="flex-1 p-6 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-center text-white mt-16">
              <div className="max-w-md mx-auto">
                <div className={`w-20 h-20 bg-gradient-to-r ${theme.primary} rounded-3xl flex items-center justify-center mx-auto mb-6`}>
                  <span className="text-3xl">🚀</span>
                </div>
                <h2 className={`text-2xl font-bold mb-3 bg-gradient-to-r ${theme.primary} bg-clip-text text-transparent`}>
                  AI スキルシート分析システム
                </h2>
                <p className="text-gray-300 mb-6">
                  高度なRAG技術で、スキルシートを詳細分析します
                </p>
                {!documentsLoaded && (
                  <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-4 border border-amber-400/30">
                    <p className="text-amber-200">
                      ⚠️ 左側からファイルをアップロードして開始してください
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className="max-w-3xl w-full">
                    <div
                      className={`p-6 rounded-3xl ${
                        message.role === 'user'
                          ? `${theme.userBg} text-white ml-auto max-w-md shadow-lg ${theme.shadow}`
                          : 'bg-white/10 backdrop-blur-xl border border-white/20 text-white shadow-lg shadow-black/10'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              h1: ({ children }) => (
                                <h1 className="text-2xl font-bold text-white mb-4 mt-0">
                                  {children}
                                </h1>
                              ),
                              h2: ({ children }) => (
                                <h2 className={`text-xl font-semibold ${theme.secondary} mb-3 mt-6`}>
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className={`text-lg font-medium ${theme.accent} mb-2 mt-4`}>
                                  {children}
                                </h3>
                              ),
                              ul: ({ children }) => (
                                <ul className="list-disc list-inside space-y-2 mb-4 text-gray-200">
                                  {children}
                                </ul>
                              ),
                              ol: ({ children }) => (
                                <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-200">
                                  {children}
                                </ol>
                              ),
                              li: ({ children }) => (
                                <li className="text-gray-200">
                                  {children}
                                </li>
                              ),
                              p: ({ children }) => (
                                <p className="text-gray-100 mb-3 leading-relaxed">
                                  {children}
                                </p>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-white">
                                  {children}
                                </strong>
                                ),
                              hr: () => (
                                <hr className="my-6 border-white/20" />
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className={`border-l-4 ${theme.secondary.replace('text-', 'border-')} pl-4 italic text-gray-300 my-4 bg-white/5 rounded-r-lg py-2`}>
                                  {children}
                                </blockquote>
                              ),
                              code: ({ children, className }) => {
                                const isInline = !className?.includes('language-');
                                if (isInline) {
                                  return (
                                    <code className={`bg-white/20 px-2 py-1 rounded-lg text-sm font-mono ${theme.secondary}`}>
                                      {children}
                                    </code>
                                  );
                                }
                                return (
                                  <code className="block bg-white/10 p-4 rounded-xl text-sm font-mono overflow-x-auto border border-white/10">
                                    {children}
                                  </code>
                                );
                              },
                              table: ({ children }) => (
                                <div className="overflow-x-auto my-4">
                                  <table className="min-w-full divide-y divide-white/20 bg-white/5 rounded-xl overflow-hidden">
                                    {children}
                                  </table>
                                </div>
                              ),
                              th: ({ children }) => (
                                <th className={`px-4 py-3 bg-white/10 text-left text-xs font-medium ${theme.secondary} uppercase tracking-wider`}>
                                  {children}
                                </th>
                              ),
                              td: ({ children }) => (
                                <td className="px-4 py-3 text-sm text-gray-200">
                                  {children}
                                </td>
                              ),
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <span className="text-white font-medium">{message.content}</span>
                      )}
                    </div>
                    
                    {message.sources && message.sources.length > 0 && (
                      <div className="mt-4 space-y-3">
                        <p className="text-xs text-gray-400 font-medium">📚 参考情報:</p>
                        <div className="grid gap-3">
                          {message.sources.map((source, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl">
                              <div className={`font-medium ${theme.secondary} mb-2 flex items-center space-x-2`}>
                                <span className={`w-2 h-2 ${theme.secondary.replace('text-', 'bg-')} rounded-full`}></span>
                                <span className="text-sm">📄 {source.source}</span>
                              </div>
                              <p className="text-gray-300 text-sm leading-relaxed">{source.content}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {isLoading && (
            <div className="flex justify-start mt-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-xl p-4 rounded-3xl border border-white/20">
                <div className="flex items-center space-x-3">
                  <div className="flex space-x-1">
                    <div className={`w-2 h-2 ${theme.secondary.replace('text-', 'bg-')} rounded-full animate-bounce`}></div>
                    <div className={`w-2 h-2 ${theme.accent.replace('text-', 'bg-')} rounded-full animate-bounce`} style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-pink-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                  <span className="text-gray-300 text-sm">AI が分析中...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア */}
        <div className="p-6 border-t border-white/10">
          <div className="max-w-4xl mx-auto">
            <div className="flex space-x-4 bg-white/10 backdrop-blur-xl rounded-3xl p-3 border border-white/20">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  documentsLoaded 
                    ? "質問を入力してください..." 
                    : "先にドキュメントをアップロードしてください"
                }
                disabled={!documentsLoaded || isLoading}
                className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-400 resize-none p-2"
                rows={1}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || !documentsLoaded || isLoading}
                className={`bg-gradient-to-r ${theme.primary} text-white px-6 py-2 rounded-2xl font-medium hover:${theme.primaryHover} disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-lg ${theme.shadow} hover:${theme.shadowHover}`}
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
