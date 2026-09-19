import type { Metadata } from 'next';

// Components
import AuthScreen from '@/containers/AuthScreen';

export const metadata: Metadata = {
    title: 'Sign in',
    description: 'Sign in to your Sprout account.'
};

// Must stay dynamic: prerendering inlines the build-time GOOGLE_CLIENT_ID, which on
// Vercel is the "[SENSITIVE]" placeholder `vercel pull` writes for sensitive vars.
export const dynamic = 'force-dynamic';

const LoginPage = () => {
    return <AuthScreen mode="login" clientId={process.env.GOOGLE_CLIENT_ID ?? ''} />;
};

export default LoginPage;
