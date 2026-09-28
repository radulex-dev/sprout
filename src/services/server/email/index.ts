import 'server-only';
import nodemailer from 'nodemailer';

// Constants
import { ERROR_NOT_CONFIGURED, ERROR_SEND_FAILED } from './constants';

// Types
import type { EmailMessage } from './types';

const transporters = new Map<string, ReturnType<typeof nodemailer.createTransport>>();

const readSmtpEnvironment = () => {
    return {
        host: process.env.SMTP_HOST ?? '',
        port: process.env.SMTP_PORT ?? '',
        user: process.env.SMTP_USER ?? '',
        password: process.env.SMTP_PASSWORD ?? '',
        from: process.env.EMAIL_FROM ?? ''
    };
};

export const isEmailConfigured = (): boolean => {
    const environment = readSmtpEnvironment();

    return Boolean(environment.host && environment.port && environment.user && environment.password && environment.from);
};

const getTransporter = (): ReturnType<typeof nodemailer.createTransport> | undefined => {
    if (!isEmailConfigured()) {
        return undefined;
    }

    const environment = readSmtpEnvironment();
    const port = Number(environment.port);
    const key = `${environment.host}:${port}:${environment.user}`;
    const cached = transporters.get(key);

    if (cached) {
        return cached;
    }

    const created = nodemailer.createTransport({
        host: environment.host,
        port,
        secure: port === 465,
        auth: {
            user: environment.user,
            pass: environment.password
        }
    });
    transporters.set(key, created);

    return created;
};

export const sendEmail = async (message: EmailMessage): Promise<void> => {
    try {
        const mailer = getTransporter();

        if (!mailer) {
            console.warn(ERROR_NOT_CONFIGURED);

            return;
        }

        await mailer.sendMail({
            from: process.env.EMAIL_FROM,
            to: message.to,
            subject: message.subject,
            html: message.html
        });
    } catch (error) {
        console.error(ERROR_SEND_FAILED, error);
    }
};
