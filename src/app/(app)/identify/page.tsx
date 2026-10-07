import type { Metadata } from 'next';

// Components
import IdentifyScreen from '@/containers/IdentifyScreen';

// Auth
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = {
    title: 'Identify',
    description: 'Identify a plant species from a photo with PlantNet.'
};

const IdentifyPage = async () => {
    const session = await requireUser();

    return <IdentifyScreen emailVerified={session.user.emailVerified} />;
};

export default IdentifyPage;
