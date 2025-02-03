/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Modern rota yapılandırmaları
  trailingSlash: false,
  cleanUrls: true,
  rewrites: async () => {
    return []
  },
  redirects: async () => {
    return []
  },
  headers: async () => {
    return []
  },
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/inventory/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8000',
        pathname: '/media/**',
      },
      {
        protocol: 'https',
        hostname: 'wersiyon44.pythonanywhere.com',
        pathname: '/media/**',
      },
    ],
  },
}

module.exports = nextConfig