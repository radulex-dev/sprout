import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { APIError, createAuthMiddleware } from 'better-auth/api';
import { nextCookies } from 'better-auth/next-js';
import { after } from 'next/server';

// Constants
import { PASSWORD_POLICY_CODE, PASSWORD_POLICY_MESSAGE, PASSWORD_POLICY_PATHS, RESET_TOKEN_TTL_SECONDS, SEND_VERIFICATION_PATH, SIGN_UP_EMAIL_PATH, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_TOKEN_TTL_SECONDS } from './constants';

// Helpers
import { isPasswordCompliant } from '@/helpers/password';

// Services
import { dispatchResetRequest, sendPasswordResetEmail } from '@/services/server/auth/reset';
import { sendEmail } from '@/services/server/email';

// Database
import { database } from '@/lib/db';
import { account, plants, session, user, verification } from '@/lib/db/schema';

// Types
import { type PasswordPolicyContext } from './types';

const additionalTrustedOrigins = (process.env.BETTER_AUTH_TRUSTED_ORIGINS ?? '')
    .split(',')
    .map((origin) => {
        return origin.trim();
    })
    .filter(Boolean);

export const auth = betterAuth({
    database: drizzleAdapter(database, {
        provider: 'pg',
        schema: {
            account,
            plants,
            session,
            user,
            verification
        }
    }),
    trustedOrigins: additionalTrustedOrigins,
    disabledPaths: [SEND_VERIFICATION_PATH],
    emailAndPassword: {
        enabled: true,
        resetPasswordTokenExpiresIn: RESET_TOKEN_TTL_SECONDS,
        revokeSessionsOnPasswordReset: true,
        sendResetPassword: ({ user, url, token }) => {
            after(() => {
                return dispatchResetRequest({
                    user,
                    url,
                    token,
                    sendReset: async (props) => {
                        await sendPasswordResetEmail(props);
                    },
                    sendVerification: async (props) => {
                        await auth.api.sendVerificationEmail({
                            body: props
                        });
                    }
                });
            });

            return Promise.resolve();
        }
    },
    emailVerification: {
        sendOnSignUp: false,
        autoSignInAfterVerification: false,
        expiresIn: VERIFY_EMAIL_TOKEN_TTL_SECONDS,
        sendVerificationEmail: ({ user, url }) => {
            return sendEmail({
                to: user.email,
                subject: VERIFY_EMAIL_SUBJECT,
                html: `<p>Confirm your email address for Sprout:</p><p><a href="${url}">Verify your email</a></p>`
            });
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
        }
    },
    hooks: {
        before: createAuthMiddleware((context: PasswordPolicyContext) => {
            if (PASSWORD_POLICY_PATHS.has(context.path)) {
                const password = context.path === SIGN_UP_EMAIL_PATH ? context.body.password : context.body.newPassword;

                if (typeof password === 'string' && !isPasswordCompliant(password)) {
                    throw APIError.from('BAD_REQUEST', {
                        code: PASSWORD_POLICY_CODE,
                        message: PASSWORD_POLICY_MESSAGE
                    });
                }
            }

            return Promise.resolve();
        })
    },
    plugins: [nextCookies()]
});
