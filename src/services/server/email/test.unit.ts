import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { EMAIL_USER_AGENT, ERROR_NOT_CONFIGURED, ERROR_SEND_FAILED, RESEND_ENDPOINT } from './constants';

// Helpers
import { mockResponse, stubFetch } from '@test/vitest/helpers/mockApi';

// Services
import { sendEmail } from './index';

// Types
import { FetchMock } from '@test/vitest/helpers/mockApi/types';

describe('sendEmail', () => {
    let fetchMock: FetchMock;

    beforeEach(() => {
        fetchMock = stubFetch();
        vi.stubEnv('RESEND_API_KEY', 're_test_key');
        vi.stubEnv('EMAIL_FROM', 'no-reply@example.test');
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it('warns and skips the request when the API key is missing', async () => {
        vi.stubEnv('RESEND_API_KEY', '');

        await sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(vi.mocked(console.warn)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.warn)).toHaveBeenCalledWith(ERROR_NOT_CONFIGURED);
    });

    it('warns and skips the request when the sender address is missing', async () => {
        vi.stubEnv('EMAIL_FROM', '');

        await sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });

        expect(fetchMock).not.toHaveBeenCalled();
        expect(vi.mocked(console.warn)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.warn)).toHaveBeenCalledWith(ERROR_NOT_CONFIGURED);
    });

    it('POSTs the message to Resend with the transport headers', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            id: 'email_1'
        }, 200));

        await sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });

        const [input, init] = fetchMock.mock.calls.at(0) ?? [];
        const headers = init?.headers as Record<string, string>;

        expect(input).toBe(RESEND_ENDPOINT);
        expect(init?.method).toBe('POST');
        expect(headers.Authorization).toBe('Bearer re_test_key');
        expect(headers['Content-Type']).toBe('application/json');
        expect(headers['User-Agent']).toBe(EMAIL_USER_AGENT);
        expect(JSON.parse(init?.body as string)).toEqual({
            from: 'no-reply@example.test',
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });
    });

    it('logs the status and body and resolves when Resend rejects the send', async () => {
        fetchMock.mockResolvedValue(mockResponse({
            statusCode: 403,
            name: 'validation_error',
            message: 'The domain is not verified.'
        }, 403));

        await expect(sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        })).resolves.toBeUndefined();

        expect(vi.mocked(console.error)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.error)).toHaveBeenCalledWith(ERROR_SEND_FAILED, 403, expect.stringContaining('validation_error'));
    });

    it('logs a fallback detail when the error body cannot be read', async () => {
        fetchMock.mockResolvedValue({
            ok: false,
            status: 403,
            text: () => {
                return Promise.reject(new Error('stream closed'));
            }
        } as unknown as Response);

        await expect(sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        })).resolves.toBeUndefined();

        expect(vi.mocked(console.error)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.error)).toHaveBeenCalledWith(ERROR_SEND_FAILED, 403, '');
    });

    it('logs and resolves when the network request rejects', async () => {
        fetchMock.mockRejectedValue(new Error('socket hang up'));

        await expect(sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        })).resolves.toBeUndefined();

        expect(vi.mocked(console.error)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.error)).toHaveBeenCalledWith(ERROR_SEND_FAILED, expect.any(Error));
    });
});
