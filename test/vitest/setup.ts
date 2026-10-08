import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

vi.mock('server-only', () => {
    return {};
});

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.useRealTimers();
});
