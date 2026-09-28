import type { NextConfig } from 'next';

const buildId = process.env.NEXT_PUBLIC_BUILD_ID;

const nextConfig: NextConfig = {
    output: 'standalone',
    env: {
        NEXT_PUBLIC_BUILD_ID: buildId === '' || buildId === undefined ? 'dev' : buildId
    },
    poweredByHeader: false,
    reactStrictMode: true,
    experimental: {
        serverActions: {
            // Camera photos (and identify captures) exceed the 1MB default.
            bodySizeLimit: '5mb'
        }
    }
};

export default nextConfig;
