import type { Metadata } from 'next';

// Components
import AuthScreen from '@/containers/AuthScreen';

export const metadata: Metadata = {
    title: 'Sign up',
    description: 'Create a Sprout account and start tracking your houseplants.'
};

// Must stay dynamic: prerendering inlines the build-time GOOGLE_CLIENT_ID, which on
// Vercel is the "[SENSITIVE]" placeholder `vercel pull` writes for sensitive vars.
export const dynamic = 'force-dynamic';

const SignUpPage = () => {
    return <AuthScreen mode="signup" clientId={process.env.GOOGLE_CLIENT_ID ?? ''} />;
};

export default SignUpPage;
