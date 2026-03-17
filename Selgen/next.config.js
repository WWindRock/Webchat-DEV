/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
    serverComponentsExternalPackages: ['@neondatabase/serverless']
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '6410',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '6410',
      },
      {
        protocol: 'http',
        hostname: '107.172.137.173',
        port: '6410',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/canvas',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig
