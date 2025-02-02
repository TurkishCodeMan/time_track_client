/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': '.',
      '@/components': './components',
      '@/features': './features',
      '@/lib': './lib',
      '@/styles': './styles',
      '@/types': './types',
      '@/utils': './utils'
    }
    return config
  }
}

module.exports = nextConfig 