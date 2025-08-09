import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, crypto: false, stream: false, util: false, buffer: false,
        'pdf-parse': false,
        // pdfreader を残すなら false も追加
        // 'pdfreader': false,
      };
    }
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push('pdf-parse');
      // pdfreader を残すなら externals も追加
      // config.externals.push('pdfreader');
    }
    return config;
  },
  // Next 15ではこちら（experimental配下ではない）
  serverExternalPackages: ['pdf-parse'/*, 'pdfreader'*/],
};

export default nextConfig;