import type { NextConfig } from 'next';

const buildId = process.env.NEXT_PUBLIC_BUILD_ID;
const allowedDevelopmentOrigins = (process.env.NEXT_ALLOWED_DEV_ORIGINS ?? '')
    .split(',')
    .map((origin) => {
        return origin.trim();
    })
    .filter(Boolean);

const nextConfig: NextConfig = {
    allowedDevOrigins: allowedDevelopmentOrigins,
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
