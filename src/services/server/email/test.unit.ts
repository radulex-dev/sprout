import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Constants
import { ERROR_NOT_CONFIGURED, ERROR_SEND_FAILED } from './constants';

// Services
import { sendEmail } from './index';

const { createTransportMock, sendMailMock } = vi.hoisted(() => {
    const sendMailMock = vi.fn();

    return {
        createTransportMock: vi.fn(() => {
            return {
                sendMail: sendMailMock
            };
        }),
        sendMailMock
    };
});

vi.mock('nodemailer', () => {
    return {
        default: {
            createTransport: createTransportMock
        }
    };
});

describe('sendEmail', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        createTransportMock.mockImplementation(() => {
            return {
                sendMail: sendMailMock
            };
        });
        vi.stubEnv('SMTP_HOST', 'smtp.example.test');
        vi.stubEnv('SMTP_PORT', '587');
        vi.stubEnv('SMTP_USER', 'smtp-user');
        vi.stubEnv('SMTP_PASSWORD', 'smtp-password');
        vi.stubEnv('EMAIL_FROM', 'no-reply@example.test');
        vi.spyOn(console, 'error').mockImplementation(vi.fn());
        vi.spyOn(console, 'warn').mockImplementation(vi.fn());
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        vi.restoreAllMocks();
    });

    it.each(['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'EMAIL_FROM'])('warns and skips the send when %s is blank', async (variable) => {
        vi.stubEnv(variable, '');

        await sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });

        expect(sendMailMock).not.toHaveBeenCalled();
        expect(vi.mocked(console.warn)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.warn)).toHaveBeenCalledWith(ERROR_NOT_CONFIGURED);
    });

    it('sends the message through the transport and resolves', async () => {
        sendMailMock.mockResolvedValue({
            accepted: ['user@example.test']
        });

        await expect(sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        })).resolves.toBeUndefined();

        expect(sendMailMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock).toHaveBeenCalledWith({
            from: 'no-reply@example.test',
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });
    });

    it('reuses one transport for subsequent sends', async () => {
        vi.stubEnv('SMTP_HOST', 'reuse.example.test');
        sendMailMock.mockResolvedValue({
            accepted: ['user@example.test']
        });

        await sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });
        await sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });

        expect(createTransportMock).toHaveBeenCalledTimes(1);
        expect(sendMailMock).toHaveBeenCalledTimes(2);
    });

    it('logs and resolves when the transport rejects the send', async () => {
        sendMailMock.mockRejectedValue(new Error('connection refused'));

        await expect(sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        })).resolves.toBeUndefined();

        expect(vi.mocked(console.error)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.error)).toHaveBeenCalledWith(ERROR_SEND_FAILED, expect.any(Error));
    });

    it('logs and resolves when the transport cannot be created', async () => {
        vi.stubEnv('SMTP_HOST', 'broken.example.test');
        createTransportMock.mockImplementationOnce(() => {
            throw new Error('invalid transport options');
        });

        await expect(sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        })).resolves.toBeUndefined();

        expect(vi.mocked(console.error)).toHaveBeenCalledTimes(1);
        expect(vi.mocked(console.error)).toHaveBeenCalledWith(ERROR_SEND_FAILED, expect.any(Error));
    });

    it.each([{
        port: '465',
        secure: true
    }, {
        port: '587',
        secure: false
    }])('requires TLS and derives secure=$secure for port $port', async ({ port, secure }) => {
        vi.stubEnv('SMTP_HOST', `tls-${port}.example.test`);
        vi.stubEnv('SMTP_PORT', port);
        sendMailMock.mockResolvedValue({
            accepted: ['user@example.test']
        });

        await sendEmail({
            to: 'user@example.test',
            subject: 'Verify your email',
            html: '<p>Verify</p>'
        });

        expect(createTransportMock).toHaveBeenCalledWith(expect.objectContaining({
            requireTLS: true,
            secure
        }));
    });
});
