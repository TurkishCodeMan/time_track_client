/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname
    };
    return config;
  },
  output: 'standalone',
  experimental: {
    serverActions: true
  }
};

module.exports = nextConfig; 