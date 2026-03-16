/** @type {import('next').NextConfig} */

const securityHeaders = [
    { key: 'X-DNS-Prefetch-Control', value: 'on' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-XSS-Protection', value: '1; mode=block' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig = {
    output: 'standalone',
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'shopping-phinf.pstatic.net' },
            { protocol: 'https', hostname: 'images.weserv.nl' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'ui-avatars.com' },
            { protocol: 'https', hostname: 'www.gstatic.com' },
            // 무신사 / 29CM CDN 도메인
            { protocol: 'https', hostname: 'img.29cm.co.kr' },
            { protocol: 'https', hostname: 'image.msscdn.net' },
        ],
        formats: ['image/avif', 'image/webp'],
    },
    async headers() {
        return [
            {
                source: '/(.*)',
                headers: securityHeaders,
            },
        ];
    },
};

module.exports = nextConfig;

import('@opennextjs/cloudflare').then((m) => m.initOpenNextCloudflareForDev());
