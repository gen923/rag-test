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

  private smartChunking(content: string, source: string) {
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
    } else {
      // 他のファイル形式の場合は意味的な段落で分割
      const paragraphs = content.split('\n\n').filter(p => p.trim().length > 30);
      chunks.push(...paragraphs.map(p => ({
        content: p.trim(),
        metadata: { type: 'paragraph' }
      })));
    }
    
    return chunks;
  }

  search(query: string, topK: number = 3): DocumentChunk[] {
    // 改善されたキーワードマッチング + スコアリング
    const scored = this.chunks.map(chunk => ({
      chunk,
      score: this.calculateImprovedSimilarity(query, chunk.content, chunk.metadata)
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter(item => item.score > 0.15)
      .map(item => item.chunk);
  }

  private calculateImprovedSimilarity(query: string, content: string, metadata: any): number {
    const queryLower = query.toLowerCase();
    const contentLower = content.toLowerCase();
    
    let score = 0;
    
    // 完全一致ボーナス
    if (contentLower.includes(queryLower)) {
      score += 0.8;
    }
    
    // キーワードマッチング
    const queryWords = queryLower.split(/\s+/);
    const contentWords = contentLower.split(/\s+/);
    const matches = queryWords.filter(word => contentWords.includes(word));
    score += (matches.length / queryWords.length) * 0.6;
    
    // 技術的なキーワードの重み付け
    const techKeywords = ['java', 'python', 'react', 'vue', 'angular', 'node', 'javascript', 'typescript', 'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'エンジニア', 'フロントエンド', 'バックエンド', 'フルスタック'];
    for (const keyword of techKeywords) {
      if (queryLower.includes(keyword) && contentLower.includes(keyword)) {
        score += 0.3;
      }
    }
    
    // データの種類による重み付け
    if (metadata.type === 'excel_data' && queryLower.includes('エンジニア')) {
      score += 0.2;
    }
    
    return Math.min(score, 1.0);
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

  getStatus() {
    return {
      chunkCount: this.chunks.length,
      sources: [...new Set(this.chunks.map(c => c.source))]
    };
  }
}

export const vectorStore = new SimpleVectorStore();
