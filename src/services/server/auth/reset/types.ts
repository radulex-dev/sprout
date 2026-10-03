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
