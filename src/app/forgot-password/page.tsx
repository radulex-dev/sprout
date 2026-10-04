import type { Metadata } from 'next';
import { cookies } from 'next/headers';

// Constants
import { RESET_PREFILL_COOKIE } from '@/lib/auth/constants';

// Components
import ForgotPasswordScreen from '@/containers/ForgotPasswordScreen';

export const metadata: Metadata = {
    title: 'Reset your password',
    description: 'Request a password reset link for your Sprout account.'
};

const ForgotPasswordPage = async () => {
    const store = await cookies();
    const rawPrefill = store.get(RESET_PREFILL_COOKIE)?.value;
    const initialEmail = rawPrefill ? decodeURIComponent(rawPrefill) : undefined;

    return <ForgotPasswordScreen initialEmail={initialEmail} />;
};

export default ForgotPasswordPage;
