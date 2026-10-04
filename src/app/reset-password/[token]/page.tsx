import type { Metadata } from 'next';

// Constants
import { ResetTokenState } from '@/services/server/auth/reset/constants';

// Components
import ResetPasswordScreen from '@/containers/ResetPasswordScreen';

// Services
import { getResetTokenStatus } from '@/services/server/auth/reset';

export const metadata: Metadata = {
    title: 'Choose a new password',
    description: 'Set a new password for your Sprout account.'
};

interface Props {
    params: Promise<{ token: string; }>;
}

const ResetPasswordPage = async ({ params }: Props) => {
    const { token } = await params;

    const status = await getResetTokenStatus(token);
    const isTokenExpired = status.state === ResetTokenState.Expired;

    return <ResetPasswordScreen token={token} email={status.email} emailVerified={status.emailVerified} tokenExpired={isTokenExpired} />;
};

export default ResetPasswordPage;
