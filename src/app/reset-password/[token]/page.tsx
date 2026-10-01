import type { Metadata } from 'next';

// Components
import ResetPasswordScreen from '@/containers/ResetPasswordScreen';

export const metadata: Metadata = {
    title: 'Choose a new password',
    description: 'Set a new password for your Sprout account.'
};

interface Props {
    params: Promise<{ token: string; }>;
}

const ResetPasswordPage = async ({ params }: Props) => {
    const { token } = await params;

    return <ResetPasswordScreen token={token} />;
};

export default ResetPasswordPage;
