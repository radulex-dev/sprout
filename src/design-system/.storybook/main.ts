import type { StorybookConfig } from '@storybook/nextjs-vite';

const config: StorybookConfig = {
    stories: ['../**/*.mdx', '../**/*.stories.@(ts|tsx)'],
    addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
    framework: {
        name: '@storybook/nextjs-vite',
        options: {}
    },
    staticDirs: [{
        from: '../../../src/assets/fonts/manrope',
        to: '/fonts'
    }]
};

export default config;
