/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Configuração de headers HTTP para cache
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/_next/image/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable, stale-while-revalidate=86400',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate, max-age=0',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
        ],
      },
    ]
  },
  // Gera nomes de arquivos com hash para cache busting
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.output.filename = (pathData) => {
        return `static/chunks/${pathData.chunk?.name || 'chunk'}-[contenthash].js`
      }
    }
    return config
  },
};

export default nextConfig;
