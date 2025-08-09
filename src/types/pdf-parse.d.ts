declare module 'pdf-parse' {
  interface PDFData {
    numpages: number; text: string; version: string; info: any; metadata: any;
  }
  interface PDFParseOptions {
    pagerender?: (pageData: any) => Promise<string> | string;
    max?: number;
  }
  function parse(buffer: Buffer | ArrayBuffer, options?: PDFParseOptions): Promise<PDFData>;
  export = parse;
}

declare module 'pdf-parse/lib/pdf-parse' {
  interface PDFData {
    numpages: number; text: string; version: string; info: any; metadata: any;
  }
  interface PDFParseOptions {
    pagerender?: (pageData: any) => Promise<string> | string;
    max?: number;
  }
  function parse(buffer: Buffer | ArrayBuffer, options?: PDFParseOptions): Promise<PDFData>;
  export = parse;
}