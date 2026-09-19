import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // Vercel builds its own output layout and `standalone` breaks it on Next 16.3.x
    // (ENOENT .next/next-server.js.nft.json). The Docker prod target still gets it.
    output: process.env.VERCEL ? undefined : 'standalone',
    env: {
        NEXT_PUBLIC_BUILD_ID: process.env.NEXT_PUBLIC_BUILD_ID ?? process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev'
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
