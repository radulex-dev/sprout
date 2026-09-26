import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { after } from 'next/server';

// Constants
import { SEND_VERIFICATION_PATH, VERIFY_EMAIL_SUBJECT, VERIFY_EMAIL_TOKEN_TTL_SECONDS } from './constants';

// Services
import { sendEmail } from '@/services/server/email';

// Database
import { database } from '@/lib/db';
import { account, plants, session, user, verification } from '@/lib/db/schema';

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
    disabledPaths: [SEND_VERIFICATION_PATH],
    emailAndPassword: {
        enabled: true
    },
    emailVerification: {
        sendOnSignUp: false,
        autoSignInAfterVerification: false,
        expiresIn: VERIFY_EMAIL_TOKEN_TTL_SECONDS,
        sendVerificationEmail: ({ user, url }) => {
            after(() => {
                return sendEmail({
                    to: user.email,
                    subject: VERIFY_EMAIL_SUBJECT,
                    html: `<p>Confirm your email address for Sprout:</p><p><a href="${url}">Verify your email</a></p>`
                });
            });

            return Promise.resolve();
        }
    },
    socialProviders: {
        google: {
            clientId: process.env.GOOGLE_CLIENT_ID ?? '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? ''
        }
    },
    plugins: [nextCookies()]
});
