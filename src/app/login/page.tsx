import type { Metadata } from 'next';

// Components
import AuthScreen from '@/containers/AuthScreen';

export const metadata: Metadata = {
    title: 'Sign in',
    description: 'Sign in to your Sprout account.'
};

const LoginPage = () => {
    return <AuthScreen mode="login" clientId={process.env.GOOGLE_CLIENT_ID ?? ''} />;
};

export default LoginPage;
