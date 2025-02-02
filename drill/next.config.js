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
  }
}

module.exports = nextConfig