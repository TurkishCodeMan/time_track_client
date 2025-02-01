/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': __dirname,
      '@/components': __dirname + '/components',
      '@/features': __dirname + '/features',
      '@/lib': __dirname + '/lib',
      '@/styles': __dirname + '/styles',
      '@/types': __dirname + '/types',
      '@/utils': __dirname + '/utils'
    };
    return config;
  }
};

module.exports = nextConfig; 