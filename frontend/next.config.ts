import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:8000/api/:path*',
      },
    ];
  },
  experimental: {
    middlewareClientMaxBodySize: '1gb',
    serverActions: {
      bodySizeLimit: '1gb',
    },
  },
};

export default nextConfig;
