import fs from 'fs';
import path from 'path';

export interface DocumentChunk {
  id: string;
  content: string;
  source: string;
  metadata: any;
}

// シンプルなテキスト類似度計算（実際のエンベディングの代替）
function calculateSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

export class SimpleVectorStore {
  private chunks: DocumentChunk[] = [];
  private dataPath = 'data/vectors/chunks.json';

  constructor() {
    this.loadChunks();
  }

  addDocuments(content: string, source: string, metadata: any = {}) {
    // 改善されたチャンク化
    const chunks = this.smartChunking(content, source);
    
    chunks.forEach((chunkData, index) => {
      this.chunks.push({
        id: `${source}_${index}`,
        content: chunkData.content,
        source,
        metadata: { ...metadata, ...chunkData.metadata }
      });
    });
    
    this.saveChunks();
  }

  private smartChunking(content: string, source: string): any[] {
    const chunks = [];
    
    if (source.includes('.xlsx') || source.includes('.xls')) {
      // Excelファイルの改善されたチャンク化
      const lines = content.split('\n');
      let currentSection = '';
      let currentData: string[] = [];
      
      for (const line of lines) {
        if (line.includes('シート:')) {
          if (currentData.length > 0) {
            chunks.push({
              content: `${currentSection}\n${currentData.join('\n')}`,
              metadata: { section: currentSection, type: 'excel_section' }
            });
          }
          currentSection = line;
          currentData = [];
        } else if (line.trim()) {
          currentData.push(line);
          
          // 3行ごとにチャンクを作成（関連する情報をまとめる）
          if (currentData.length >= 3) {
            chunks.push({
              content: `${currentSection}\n${currentData.join('\n')}`,
              metadata: { section: currentSection, type: 'excel_data' }
            });
            currentData = [];
          }
        }
      }
      
      // 残りのデータ
      if (currentData.length > 0) {
        chunks.push({
          content: `${currentSection}\n${currentData.join('\n')}`,
          metadata: { section: currentSection, type: 'excel_data' }
        });
      }

    } else if (source.includes('.pdf')) {
      console.log('📄 PDF専用チャンキング開始（修正版）');
      
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      let currentChunk: string[] = [];
      let chunkCount = 0;
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        currentChunk.push(line);
        
        // より大きなチャンクサイズで重要情報をまとめて保持
        const shouldCreateChunk = (
          currentChunk.length >= 15 && ( // 15行以上で作成
            line.includes('◾') || 
            line.includes('TEL:') || 
            line.includes('MAIL:') || 
            line.includes('スキル:') ||
            line.includes('プロジェクト') ||
            line.includes('経験:') ||
            line.includes('所属:') ||
            currentChunk.length >= 25 // 最大25行で強制作成
          )
        ) || i === lines.length - 1;
        
        if (shouldCreateChunk && currentChunk.length > 5) { // 最低6行
          const chunkText = currentChunk.join('\n');
          
          // より詳細なメタデータ
          const metadata = {
            type: 'pdf_section',
            fileType: 'pdf',
            chunkIndex: chunkCount++,
            lineCount: currentChunk.length,
            // より精密な情報分類
            hasContactInfo: chunkText.includes('TEL:') || chunkText.includes('MAIL:') || chunkText.includes('電話') || chunkText.includes('メール'),
            hasSkillInfo: chunkText.includes('スキル:') || chunkText.includes('言語:') || chunkText.includes('Python') || chunkText.includes('Java'),
            hasProjectInfo: chunkText.includes('プロジェクト') || chunkText.includes('開発') || chunkText.includes('システム'),
            hasPersonalInfo: chunkText.includes('◾') || chunkText.includes('歳') || chunkText.includes('男') || chunkText.includes('女') || chunkText.includes('最寄り') || chunkText.includes('単価'),
            // 具体的な情報の有無をチェック
            hasAge: chunkText.includes('歳') || /\d{2}/.test(chunkText),
            hasStation: chunkText.includes('駅') || chunkText.includes('最寄り'),
            hasSalary: chunkText.includes('万円') || chunkText.includes('単価'),
            hasAvailability: chunkText.includes('稼働') || chunkText.includes('即日') || chunkText.includes('可能'),
          };
          
          chunks.push({
            content: chunkText,
            metadata: metadata
          });
          currentChunk = [];
        }
      }
      
      console.log(`📊 PDF チャンク作成完了: ${chunks.length}個（修正版・大型チャンク）`);

    } else {
      // 他のファイル形式の場合は意味的な段落で分割
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 30);
      chunks.push(...paragraphs.map((p, index) => ({
        content: p.trim(),
        metadata: { type: 'paragraph', chunkIndex: index }
      })));
    }
    
    return chunks;
  }

  search(query: string, topK: number = 3): DocumentChunk[] {
    console.log(`🔍 検索開始: "${query}"`);
    
    // 改善されたキーワードマッチング + スコアリング
    const scored = this.chunks.map(chunk => ({
      chunk,
      score: this.calculateImprovedSimilarity(query, chunk.content, chunk.metadata)
    }));

    // スコア順でソート
    const sorted = scored.sort((a, b) => b.score - a.score);
    
    // デバッグ情報
    console.log('🎯 上位5件のスコア:');
    sorted.slice(0, 5).forEach((item, index) => {
      console.log(`${index + 1}. スコア: ${item.score.toFixed(3)}, ソース: ${item.chunk.source}`);
      console.log(`   内容: ${item.chunk.content.substring(0, 100)}...`);
    });

    return sorted
      .slice(0, topK)
      .filter(item => item.score > 0.05) // 閾値を0.15から0.05に下げる
      .map(item => item.chunk);
  }

  private calculateImprovedSimilarity(query: string, content: string, metadata: any): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    let score = 0;
    
    // 🔧 改善1: 名前の特別処理（Y.S. ↔ YS のマッチング）
    const normalizedQuery = queryLower.replace(/[.\s]/g, '');
    const normalizedContent = contentLower.replace(/[.\s]/g, '');
    
    // 1️⃣ 完全一致チェック（改善版）
    if (contentLower.includes(queryLower) || normalizedContent.includes(normalizedQuery)) {
      score += 0.8;
    }
    
    // 🔧 改善2: 人名の特別マッチング
    if (queryLower.match(/^[a-z]{1,3}$/) && contentLower.includes('氏名')) {
      const namePattern = new RegExp(queryLower.split('').join('[.\\s]*'), 'i');
      if (namePattern.test(contentLower)) {
        score += 0.9; // 人名マッチングは高スコア
      }
    }
    
    // 2️⃣ キーワードマッチング（改善版）
    const queryWords = queryLower.split(/\s+/);
    const contentWords = contentLower.split(/[\s◾️・\n]+/).filter(w => w.length > 0);
    
    let matchCount = 0;
    for (const qWord of queryWords) {
      for (const cWord of contentWords) {
        if (cWord.includes(qWord) || qWord.includes(cWord) || 
            this.fuzzyMatch(qWord, cWord)) {
          matchCount++;
          break;
        }
      }
    }
    score += (matchCount / queryWords.length) * 0.6;
    
    // 3️⃣ 年齢・数値の特別処理
    const ageQuery = queryLower.match(/(\d+)歳?/);
    const ageContent = contentLower.match(/(\d+)歳/);
    if (ageQuery && ageContent && ageQuery[1] === ageContent[1]) {
      score += 0.7;
    }
    
    // 4️⃣ 技術キーワードの重み付け（改善版）
    const techKeywords = [
      'java', 'python', 'javascript', 'typescript', 'html', 'css',
      'react', 'vue', 'angular', 'next', 'svelte', 'spring', 'boot',
      'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'git', 'figma',
      'エンジニア', 'フロントエンド', 'バックエンド', 'フルスタック', 'se'
    ];
    
    for (const keyword of techKeywords) {
      if (queryLower.includes(keyword) && contentLower.includes(keyword)) {
        score += 0.3;
      }
    }
    
    // 5️⃣ メタデータベースの重み付け（改善版）
    if (metadata.hasPersonalInfo && 
        (queryLower.includes('年齢') || queryLower.includes('プロフィール') || 
         queryLower.match(/^[a-z]{1,3}$/))) {
      score += 0.4;
    }
    if (metadata.hasContactInfo && queryLower.includes('連絡先')) {
      score += 0.3;
    }
    if (metadata.hasSkillInfo && (queryLower.includes('スキル') || queryLower.includes('技術'))) {
      score += 0.3;
    }
    
    // 6️⃣ Excel特有のボーナス
    if (metadata.type === 'excel_data') {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
  }
  
  // 🔧 新機能: ファジーマッチング
  private fuzzyMatch(word1: string, word2: string): boolean {
    if (word1.length < 2 || word2.length < 2) return false;
    
    // 文字数の差が大きすぎる場合は false
    if (Math.abs(word1.length - word2.length) > 2) return false;
    
    // 共通文字数をチェック
    let commonChars = 0;
    for (let i = 0; i < word1.length; i++) {
      if (word2.includes(word1[i])) {
        commonChars++;
      }
    }
    
    return commonChars / word1.length > 0.6;
  }

  private saveChunks() {
    const dir = path.dirname(this.dataPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.dataPath, JSON.stringify(this.chunks, null, 2));
  }

  private loadChunks() {
    try {
      if (fs.existsSync(this.dataPath)) {
        const data = fs.readFileSync(this.dataPath, 'utf-8');
        this.chunks = JSON.parse(data);
      }
    } catch (error) {
      console.error('チャンク読み込みエラー:', error);
      this.chunks = [];
    }
  }

  // 特定のソースファイルのチャンクを削除
  removeBySource(source: string): boolean {
    const originalLength = this.chunks.length;
    this.chunks = this.chunks.filter(chunk => chunk.source !== source);
    
    if (this.chunks.length !== originalLength) {
      this.saveChunks();
      console.log(`削除完了: ${source} (${originalLength - this.chunks.length}チャンク削除)`);
      return true;
    }
    
    console.log(`削除対象なし: ${source}`);
    return false;
  }

  // 全チャンクを削除
  clearAll(): void {
    this.chunks = [];
    this.saveChunks();
    console.log('全チャンク削除完了');
  }

  // 特定のチャンクを削除
  removeChunkById(id: string): boolean {
    const originalLength = this.chunks.length;
    this.chunks = this.chunks.filter(chunk => chunk.id !== id);
    
    if (this.chunks.length !== originalLength) {
      this.saveChunks();
      return true;
    }
    return false;
  }

  // ソース一覧を取得
  getSources(): string[] {
    return [...new Set(this.chunks.map(c => c.source))];
  }

  // 特定ソースのチャンク数を取得
  getChunkCountBySource(source: string): number {
    return this.chunks.filter(chunk => chunk.source === source).length;
  }

  getStatus() {
    return {
      chunkCount: this.chunks.length,
      sources: [...new Set(this.chunks.map(c => c.source))]
    };
  }
}

export const vectorStore = new SimpleVectorStore();
