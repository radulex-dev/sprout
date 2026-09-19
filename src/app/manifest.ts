import type { MetadataRoute } from 'next';

const manifest = (): MetadataRoute.Manifest => {
    return {
        name: 'Sprout — Plant Tracker',
        short_name: 'Sprout',
        description: 'Track your houseplants, identify species with your camera, and never miss a watering.',
        id: '/',
        start_url: '/',
        display: 'standalone',
        background_color: '#f4f1e8',
        theme_color: '#0F6B45',
        orientation: 'portrait',
        icons: [{
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
        }, {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
        }, {
            src: '/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
        }, {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
        }, {
            src: '/icon-mono.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'monochrome'
        }]
    };
};

export default manifest;
