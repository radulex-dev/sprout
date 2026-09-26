import 'server-only';

// Constants
import { EMAIL_USER_AGENT, ERROR_NOT_CONFIGURED, ERROR_SEND_FAILED, RESEND_ENDPOINT } from './constants';

// Types
import type { EmailMessage } from './types';

const readErrorDetail = async (response: Response): Promise<string> => {
    try {
        return await response.text();
    } catch {
        return '';
    }
};

export const sendEmail = async (message: EmailMessage): Promise<void> => {
    const apiKey = process.env.RESEND_API_KEY ?? '';
    const emailFrom = process.env.EMAIL_FROM ?? '';
    if (!apiKey || !emailFrom) {
        console.warn(ERROR_NOT_CONFIGURED);

        return;
    }

    let response: Response;
    try {
        response = await fetch(RESEND_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'User-Agent': EMAIL_USER_AGENT
            },
            body: JSON.stringify({
                from: emailFrom,
                to: message.to,
                subject: message.subject,
                html: message.html
            })
        });
    } catch (error) {
        console.error(ERROR_SEND_FAILED, error);

        return;
    }

    if (!response.ok) {
        const detail = await readErrorDetail(response);

        console.error(ERROR_SEND_FAILED, response.status, detail);

        return;
    }
};
