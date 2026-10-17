import { describe, expect, it } from 'vitest';

// Helpers
import { isPasswordCompliant } from './index';

describe('isPasswordCompliant', () => {
    it.each([['plant123!', true], ['Plant123!', true], ['plant123', false], ['plant!!!', false], ['12345678!', false], ['plant1', false], ['', false]])('reports %s as %s', (password, expected) => {
        expect(isPasswordCompliant(password)).toBe(expected);
    });
});
