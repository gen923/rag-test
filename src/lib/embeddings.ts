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
  private dataPath = path.resolve(process.cwd(), 'data/vectors/chunks.json');

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
      console.log('📄 PDF専用チャンキング開始（細分化版）');
      
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      let chunkCount = 0;
      
      // 📝 Step 1: 重要な情報行を個別チャンク化
      const importantPatterns = [
        { pattern: /S\.K\.|◾.*S\.K\.|氏名.*S\.K\./, type: 'name_info' },
        { pattern: /(\d{2})歳|年齢.*(\d{2})|◾.*歳/, type: 'age_info' },
        { pattern: /最寄り.*駅|◾.*駅|駅.*最寄り/, type: 'station_info' },
        { pattern: /(\d{2})万円|単価.*万円|◾.*単価/, type: 'salary_info' },
        { pattern: /稼働|即日|可能|開始/, type: 'availability_info' },
        { pattern: /TEL:|MAIL:|電話|メール/, type: 'contact_info' },
        { pattern: /言語:|Python|JavaScript|TypeScript|Java/, type: 'skill_language' },
        { pattern: /ツール:|Git|PowerShell|Excel/, type: 'skill_tools' },
        { pattern: /プロジェクト|開発|システム|AI|OCR/, type: 'project_info' },
        { pattern: /クラウド|AWS|Azure|GCP/, type: 'cloud_info' }
      ];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // 各重要パターンをチェック
        for (const { pattern, type } of importantPatterns) {
          if (pattern.test(line)) {
            // 前後の行も含めてコンテキストを作成（最大3行）
            const startIndex = Math.max(0, i - 1);
            const endIndex = Math.min(lines.length - 1, i + 1);
            const contextLines = lines.slice(startIndex, endIndex + 1);
            
            const chunkText = contextLines.join('\n');
            
            chunks.push({
              content: chunkText,
              metadata: {
                type: 'pdf_detail',
                detailType: type,
                chunkIndex: chunkCount++,
                lineCount: contextLines.length,
                hasContactInfo: /TEL:|MAIL:|電話|メール/.test(chunkText),
                hasSkillInfo: /言語:|Python|JavaScript|TypeScript/.test(chunkText),
                hasProjectInfo: /プロジェクト|開発|システム/.test(chunkText),
                hasPersonalInfo: /S\.K\.|歳|駅|単価/.test(chunkText),
                hasAge: /(\d{2})歳/.test(chunkText),
                hasStation: /駅/.test(chunkText),
                hasSalary: /万円|単価/.test(chunkText),
                hasAvailability: /稼働|即日|可能/.test(chunkText),
              }
            });
            
            console.log(`📋 重要情報チャンク作成: ${type} - "${line.substring(0, 50)}..."`);
            break; // 1行につき1つのパターンマッチで十分
          }
        }
      }
      
      // 📝 Step 2: 残りの内容を小さなチャンクに分割（Excel風）
      let currentChunk: string[] = [];
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        currentChunk.push(line);
        
        // 2-3行ごとに小さなチャンクを作成（Excel処理に近い）
        if (currentChunk.length >= 2 && (
          line.includes('◾') || 
          line.includes('##') ||
          line.includes('━') ||
          i === lines.length - 1 ||
          currentChunk.length >= 3
        )) {
          
          if (currentChunk.length > 0) {
            const chunkText = currentChunk.join('\n');
            
            chunks.push({
              content: chunkText,
              metadata: {
                type: 'pdf_section',
                chunkIndex: chunkCount++,
                lineCount: currentChunk.length,
                hasContactInfo: /TEL:|MAIL:/.test(chunkText),
                hasSkillInfo: /Python|JavaScript|TypeScript/.test(chunkText),
                hasProjectInfo: /プロジェクト|開発/.test(chunkText),
                hasPersonalInfo: /S\.K\.|歳|駅|単価/.test(chunkText),
                hasAge: /(\d{2})歳/.test(chunkText),
                hasStation: /駅/.test(chunkText),
                hasSalary: /万円/.test(chunkText),
                hasAvailability: /稼働|即日/.test(chunkText),
              }
            });
            
            currentChunk = [];
          }
        }
      }
      
      console.log(`📊 PDF チャンク作成完了: ${chunks.length}個（細分化版）`);

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

    // search内のしきい値
    return sorted
      .slice(0, topK)
      .filter(item => item.score > 0.02) // 0.05 → 0.02
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
    
    // 5️⃣ プロジェクト語彙の強化
    const projectKeywords = ['プロジェクト','実績','成果','担当','フェーズ','期間','役割','PJ'];
    for (const kw of projectKeywords) {
      if (contentLower.includes(kw)) score += 0.3;
    }
    // セクション名（Excelの職務経歴書）で加点
    if (metadata?.section && /職務経歴書/.test(metadata.section)) score += 0.2;

    // 連絡先のみっぽい断片は非PJ質問時に微減点
    const isContacty = /tel|mail|メール|電話/.test(contentLower);
    if (isContacty && !/連絡|メール|電話/.test(queryLower)) score -= 0.2;

    // 6️⃣ Excel特有のボーナス
    if (metadata.type === 'excel_data') {
      score += 0.2;
    }
    
    // S.K. を強く評価
    const initials = queryLower.replace(/[^a-z]/g, '');
    if (initials === 'sk' && /\bs\.?\s*k\.?\b/i.test(content)) {
      score += 0.85;
    }
    if (/s\.?\s*k\.?/i.test(content) && (contentLower.includes('歳') || contentLower.includes('駅') || contentLower.includes('単価') || contentLower.includes('稼働'))) {
      score += 0.4;
    }
    // ラベルが無くても個人情報断片で加点
    if (metadata?.detailType === 'station_info' && /駅|最寄/.test(queryLower)) score += 0.6;
    if (metadata?.detailType === 'salary_info' && /単価|万円/.test(queryLower)) score += 0.6;
    if (metadata?.detailType === 'availability_info' && /稼働|即日/.test(queryLower)) score += 0.6;

    const fieldMap = {
      station: ['最寄','駅'],
      availability: ['稼働','即日','参画'],
      salary: ['単価','万円'],
      gender: ['性別','男性','女性'],
      age: ['年齢','歳']
    };
    const wantStation = /最寄|駅/.test(queryLower);
    const wantAvail   = /稼働|即日|参画/.test(queryLower);
    const wantSalary  = /単価|万円/.test(queryLower);
    const wantGender  = /性別|男性|女性/.test(queryLower);
    const wantAge     = /年齢|歳/.test(queryLower);

    if (wantStation && /最寄|駅/.test(contentLower)) score += 1.2;
    if (wantAvail   && /稼働|即日|参画/.test(contentLower)) score += 1.0;
    if (wantSalary  && /単価|万円/.test(contentLower)) score += 1.0;
    if (wantGender  && /性別|男性|女性/.test(contentLower)) score += 0.8;
    if (wantAge     && /年齢|歳/.test(contentLower)) score += 0.8;

    // イニシャル＋フィールドの複合（例: sk の駅）
    if (initials === 'sk' && wantStation && /最寄|駅/.test(contentLower)) score += 0.8;
    if (initials === 'ys' && wantSalary  && /単価|万円/.test(contentLower)) score += 0.8;

    // Excelの summary/職務経歴書 は人物情報が出やすいので微加点
    if (metadata?.section && /summary|職務経歴書/.test(metadata.section)) score += 0.2;

    // 質問に含まれなくても基本情報語は弱加点（汎用プロンプト対策）
    if (/最寄|駅/.test(contentLower)) score += 0.3;
    if (/稼働|即日|参画/.test(contentLower)) score += 0.25;
    if (/単価|万円/.test(contentLower)) score += 0.25;
    if (/性別|男性|女性/.test(contentLower)) score += 0.2;
    if (/年齢|歳/.test(contentLower)) score += 0.2;

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

  public keywordSearch(keywords: string[], topK: number = 5) {
    const lower = keywords.map(k => k.toLowerCase());
    const scored = this.chunks.map(chunk => {
      const text = (chunk.content || '').toLowerCase();
      let hits = 0;
      for (const k of lower) if (text.includes(k)) hits++;
      return { chunk, score: hits };
    }).filter(s => s.score > 0);
    return scored.sort((a,b) => b.score - a.score).slice(0, topK).map(s => s.chunk);
  }

  public pickBasicFieldChunks() {
    const pick = (pred: (m:any,c:string)=>boolean) =>
      this.chunks.find(ch => pred(ch.metadata || {}, ch.content || ''));
    return {
      station: pick((m,c)=> m.hasStation || /最寄|駅/.test(c)),
      availability: pick((m,c)=> m.hasAvailability || /稼働|即日/.test(c)),
      salary: pick((m,c)=> m.hasSalary || /単価|万円/.test(c)),
      gender: pick((m,c)=> m.hasGender || /性別|男性|女性/.test(c)),
      age: pick((m,c)=> m.hasAge || /年齢|歳/.test(c)),
      affiliation: pick((m,c)=> m.hasAffiliation || /所属|株式会社/.test(c)),
    };
  }
}

export const vectorStore = new SimpleVectorStore();
