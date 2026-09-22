import { describe, expect, it } from 'vitest';

// Helpers
import { decodeVapidPublicKey } from './index';

describe('decodeVapidPublicKey', () => {
    it('decodes a padded base64 key', () => {
        expect(decodeVapidPublicKey('AQ==')).toEqual(new Uint8Array([1]));
    });

    it.each([{
        alphabet: 'standard',
        input: '++//'
    }, {
        alphabet: 'URL-safe',
        input: '--__'
    }])('decodes high bytes written in the $alphabet alphabet', ({ input }) => {
        expect(decodeVapidPublicKey(input)).toEqual(new Uint8Array([251, 239, 255]));
    });

    it.each([{
        padding: 'with',
        input: 'AQ=='
    }, {
        padding: 'without',
        input: 'AQ'
    }])('decodes a key $padding padding', ({ input }) => {
        expect(decodeVapidPublicKey(input)).toEqual(new Uint8Array([1]));
    });

    it('decodes a 65-byte VAPID public key', () => {
        const key = decodeVapidPublicKey('BAECAwQFBgcICQoLDA0ODxAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0-P0A');

        expect(key).toHaveLength(65);
        expect(key.at(0)).toBe(4);
        expect(key.at(32)).toBe(32);
        expect(key.at(64)).toBe(64);
    });

    it.each(['!', 'a'])('throws for the invalid input %j', (value) => {
        expect(() => {
            return decodeVapidPublicKey(value);
        }).toThrow();
    });
});
