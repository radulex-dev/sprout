import classNames from 'classnames';
import { Suspense } from 'react';

// Components
import BottomNav from '@/components/BottomNav';
import InstallNudge from '@/components/InstallNudge';

// Helpers
import { dueTasks } from '@/helpers/care';

// Database
import { getPlantsForUser } from '@/lib/db/queries';

// Auth
import { requireUser } from '@/lib/auth/session';

// Styles
import styles from './styles.module.css';

const loadDueCount = async (): Promise<number> => {
    try {
        const session = await requireUser();
        const plants = await getPlantsForUser(session.user.id);

        return dueTasks(plants).length;
    } catch (error) {
        console.error('Failed to load due count', error);

        return 0;
    }
};

const DueCountNav = async () => {
    const count = await loadDueCount();

    return <BottomNav dueCount={count} />;
};

interface Props extends React.ComponentProps<'div'> {}

const AppLayout = async ({ children, className, ...props }: Props) => {
    const classes = classNames(className, styles.root);

    await requireUser();

    return (
        <div {...props} className={classes}>
            <a href="#main" className={styles.skipLink}>Skip to content</a>
            <Suspense fallback={<BottomNav dueCount={0} />}>
                <DueCountNav />
            </Suspense>
            <main id="main">{children}</main>
            <InstallNudge />
        </div>
    );
};

export default AppLayout;
