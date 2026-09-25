import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/contributors',
        destination: '/credits',
        permanent: false,
      },
      {
        source: '/past-papers',
        destination: '/',
        permanent: false,
      },
      {
        source: '/pastpapers',
        destination: '/',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
