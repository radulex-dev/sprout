import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('server-only', () => {
    return {};
});

afterEach(() => {
    cleanup();
});
