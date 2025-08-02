declare module 'pdf-parse' {
    interface PDFData {
      numpages: number;
      text: string;
      version: string;
      info: any;
      metadata: any;
    }
  
    function parse(buffer: Buffer | ArrayBuffer): Promise<PDFData>;
    export = parse;
  }
  
  declare module 'pdf-parse/lib/pdf-parse' {
    interface PDFData {
      numpages: number;
      text: string;
      version: string;
      info: any;
      metadata: any;
    }
  
    function parse(buffer: Buffer | ArrayBuffer): Promise<PDFData>;
    export = parse;
  }