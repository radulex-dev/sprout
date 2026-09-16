'use client';

import classNames from 'classnames';
import React, { useCallback } from 'react';
import { capitalize } from 'lodash-es';
import { Check } from 'lucide-react';

// Constants
import { ButtonSize, ButtonVariant } from '@/design-system/Button/constants';
import { CARE_META, DAY_MS } from '@/helpers/care/constants';

// Components
import Button from '@/design-system/Button';
import Popover from '@/design-system/Popover';

// Helpers
import { formatDaysAgo } from './helpers';
import { toDateValue } from '@/helpers/care';

// Styles
import styles from './styles.module.css';

// Types
import type { CareKind, Plant } from '@/types';

export interface Props extends React.ComponentProps<'div'> {
    plant: Plant;
    kind: CareKind;
    now: number;
    onDone: (kind: CareKind) => void;
}

const CareLogRow: React.FunctionComponent<Props> = ({ plant, kind, now, onDone, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const meta = CARE_META[kind];
    const last = plant.lastCare[kind];
    const daysAgo = Math.floor((now - last) / DAY_MS);

    const handleDone = useCallback(() => {
        onDone(kind);
    }, [onDone, kind]);

    return (
        <div className={classes} {...props}>
            <div className={styles.thumb}>
                <meta.icon size="1.125rem" aria-hidden />
            </div>
            <div className={styles.info}>
                <div className={styles.title}>
                    {meta.label}
                </div>
                <Popover trigger={`Last ${meta.verb} ${formatDaysAgo(daysAgo)}`} className={styles.when}>
                    {toDateValue(last)}
                </Popover>
            </div>
            <Button variant={ButtonVariant.Soft} size={ButtonSize.Sm} onClick={handleDone} icon={Check} className={styles.done}>
                {`${capitalize(meta.verb)} today`}
            </Button>
        </div>
    );
};

export default CareLogRow;
