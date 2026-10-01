import type { Metadata } from 'next';

// Components
import ForgotPasswordScreen from '@/containers/ForgotPasswordScreen';

export const metadata: Metadata = {
    title: 'Reset your password',
    description: 'Request a password reset link for your Sprout account.'
};

const ForgotPasswordPage = () => {
    return <ForgotPasswordScreen />;
};

export default ForgotPasswordPage;
