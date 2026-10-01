import type { Metadata } from 'next';

// Components
import AuthScreen from '@/containers/AuthScreen';

export const metadata: Metadata = {
    title: 'Sign in',
    description: 'Sign in to your Sprout account.'
};

export const dynamic = 'force-dynamic';

interface LoginSearchParameters {
    reset?: string;
}

interface Props {
    searchParams: Promise<LoginSearchParameters>;
}

const LoginPage = async ({ searchParams }: Props) => {
    const { reset } = await searchParams;

    return <AuthScreen mode="login" clientId={process.env.GOOGLE_CLIENT_ID ?? ''} resetSuccess={reset === 'success'} />;
};

export default LoginPage;
