import type { NextConfig } from "next";
import { isSiteIndexable, SITE_URL } from './lib/site-config';

const nextConfig: NextConfig = {
  async headers() {
    return [
      { source: '/api/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] },
      ...(!isSiteIndexable() ? [{ source: '/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }] }] : []),
    ];
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.fastianhub.com' }],
        destination: `${SITE_URL}/:path*`,
        permanent: true,
      },
      {
        source: '/contributors',
        destination: '/credits',
        permanent: true,
      },
      {
        source: '/past-papers',
        destination: '/',
        permanent: true,
      },
      {
        source: '/pastpapers',
        destination: '/',
        permanent: true,
      },
      { source: '/campus/cfd', destination: '/campus/chiniot-faisalabad', permanent: true },
      { source: '/campus/faisalabad', destination: '/campus/chiniot-faisalabad', permanent: true },
      { source: '/campus/central', destination: '/campus/lahore', permanent: true },
    ];
  },
};

export default nextConfig;
