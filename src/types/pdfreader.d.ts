declare module 'pdfreader' {
  export class PdfReader {
    parseBuffer(
      buffer: Buffer,
      cb: (err: any, item: any) => void
    ): void;
  }
} 