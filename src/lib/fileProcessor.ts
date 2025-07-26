import * as XLSX from 'xlsx';

export async function processFile(file: File): Promise<string> {
  const fileType = file.name.split('.').pop()?.toLowerCase();

  switch (fileType) {
    case 'xlsx':
    case 'xls':
      return processExcel(file);
    case 'pdf':
      return processPDF(file);
    case 'txt':
      return file.text();
    default:
      throw new Error(`サポートされていないファイル形式: ${fileType}`);
  }
}

async function processExcel(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer);
  
  let content = '';
  
  workbook.SheetNames.forEach(sheetName => {
    content += `\n\n=== シート: ${sheetName} ===\n`;
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    jsonData.forEach((row: any, index) => {
      if (row.length > 0) {
        content += `行${index + 1}: ${row.join(', ')}\n`;
      }
    });
  });
  
  return content;
}

async function processPDF(file: File): Promise<string> {
  // シンプルなPDF処理（テキストファイルとして読み込み）
  // 実際のPDF処理は将来的にpdf-parseライブラリを使用予定
  try {
    const text = await file.text();
    return text;
  } catch (error) {
    return `PDFファイル "${file.name}" の処理中にエラーが発生しました。テキストファイルとして処理してください。`;
  }
}
