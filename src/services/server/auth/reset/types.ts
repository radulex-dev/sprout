// Constants
import type { ResetTokenState } from './constants';

export interface SendPasswordResetEmailProps {
    user: SendPasswordResetEmailUser;
    url: string;
    token: string;
}

export interface SendPasswordResetEmailUser {
    id: string;
    email: string;
}

export interface ResetTokenRow {
    identifier: string;
    createdAt: Date;
}

export interface ResetTokenStatus {
    state: ResetTokenState;
    email?: string;
    emailVerified?: boolean;
}

export interface DispatchResetRequestProps {
    user: {
        id: string;
        email: string;
        emailVerified: boolean;
    };
    url: string;
    token: string;
    sendReset: (props: SendPasswordResetEmailProps) => Promise<void>;
    sendVerification: (props: {
        email: string;
        callbackURL: string;
    }) => Promise<void>;
}
