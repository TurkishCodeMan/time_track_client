/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['react-leaflet', '@react-leaflet/core', 'leaflet'],
  experimental: {
    optimizePackageImports: ['leaflet'],
  },
};

export default nextConfig;
