import type { Metadata } from 'next';

// Components
import SettingsScreen from '@/containers/SettingsScreen';

// Database
import { getPlantsForUser } from '@/lib/db/queries';

// Auth
import { requireUser } from '@/lib/auth/session';

export const metadata: Metadata = {
    title: 'Settings',
    description: 'Manage your account, plant recognition key, and care reminders.'
};

const SettingsPage = async () => {
    const session = await requireUser();
    const plants = await getPlantsForUser(session.user.id);
    const user = {
        name: session.user.name,
        email: session.user.email,
        emailVerified: session.user.emailVerified
    };

    return (
        <SettingsScreen plants={plants} user={user} />
    );
};

export default SettingsPage;
