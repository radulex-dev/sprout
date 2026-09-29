import type { Metadata } from 'next';

// Components
import AuthScreen from '@/containers/AuthScreen';

export const metadata: Metadata = {
    title: 'Sign in',
    description: 'Sign in to your Sprout account.'
};

// Must stay dynamic: GOOGLE_CLIENT_ID is a runtime variable, so prerendering would
// bake in whatever the build machine had (nothing) instead of the deployed value,
// and the sign-in screen would render its degraded "unavailable" branch forever.
export const dynamic = 'force-dynamic';

const LoginPage = () => {
    return <AuthScreen mode="login" clientId={process.env.GOOGLE_CLIENT_ID ?? ''} />;
};

export default LoginPage;
