import type { UmamiBeforeSend } from '@/components/Analytics/types';

// Umami resolves its `data-before-send` hook by NAME off `window`, so the hook has to be a
// global rather than a closure. Declared here rather than inside the component so the
// augmentation is visible without reading the implementation.
declare global {
    interface Window {
        sproutBeforeSend?: UmamiBeforeSend;
    }
}
