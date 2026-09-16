'use client';

import classNames from 'classnames';
import Link from 'next/link';
import React, { useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';

// Constants
import { TABS } from './constants';

// Styles
import styles from './styles.module.css';

// Types
import type { Tab } from './types';

export interface Props extends React.ComponentProps<'nav'> {
    dueCount: number;
}

const BottomNav: React.FunctionComponent<Props> = ({ dueCount, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const pathname = usePathname();

    const isActive = useCallback((tab: Tab): boolean => {
        if (tab.id === 'plants') {
            return pathname === '/' || pathname.startsWith('/plants');
        }

        return pathname === tab.href;
    }, [pathname]);

    const navLinks = useMemo(() => {
        return TABS.map((tab) => {
            const isTabActive = isActive(tab);
            const linkClasses = classNames({
                [styles.active]: isTabActive
            });

            return (
                <li key={tab.id} className={styles.item}>
                    <Link href={tab.href} className={linkClasses} aria-current={isTabActive ? 'page' : undefined}>
                        <span className={styles.icon}>
                            <tab.icon size="1.375rem" aria-hidden />
                        </span>
                        {tab.label}
                        {tab.id === 'care' && dueCount > 0 && (
                            <span className={styles.badge}>
                                {dueCount}
                            </span>
                        )}
                    </Link>
                </li>
            );
        });
    }, [isActive, dueCount]);

    return (
        <nav className={classes} aria-label="Primary" {...props}>
            <ul className={styles.list}>
                {navLinks}
            </ul>
        </nav>
    );
};

export default BottomNav;
