export interface BuildResetEmailProps {
    to: string;
    resetUrl: string;
    hasPassword: boolean;
}

export interface SendPasswordResetEmailProps {
    user: SendPasswordResetEmailUser;
    url: string;
    token: string;
}

export interface SendPasswordResetEmailUser {
    id: string;
    email: string;
    emailVerified: boolean;
}
