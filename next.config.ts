import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Node.jsライブラリのサーバーサイド専用設定
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // クライアントサイドではpdf-parseを除外
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        'pdf-parse': false,
      };
    }
    
    // pdf-parseをexternal（外部ライブラリ）として扱う
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pdf-parse');
    }
    
    return config;
  },
  
  // API routes用の設定
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
};

export default nextConfig;