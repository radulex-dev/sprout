export interface PasswordPolicyContext {
    body: {
        newPassword?: string;
        password?: string;
    };
    path: string;
}
