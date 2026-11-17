import classNames from 'classnames';
import React from 'react';

// Constants
import { SEASON_META } from '@/components/CareScheduleFields/constants';
import { CARE_META } from '@/helpers/care/constants';

// Components
import CareStatValue from '../CareStatValue';

// Helpers
import { waterSeasonFor } from '@/helpers/care';

// Styles
import styles from './styles.module.css';

// Types
import { CareKind, CareSeason, type Plant } from '@/types';

export interface Props extends React.ComponentProps<'dl'> {
    plant: Plant;
    now: number;
    onRequestPotSize: () => void;
}

const CareStats: React.FunctionComponent<Props> = ({ plant, now, onRequestPotSize: handleRequestPotSize, className, ...props }) => {
    const classes = classNames(styles.root, className);
    const season = waterSeasonFor(plant);
    const seasonMeta = SEASON_META[season];
    const SeasonIcon = seasonMeta.icon;
    const seasonClasses = classNames(styles.season, {
        [styles.seasonSpring]: season === CareSeason.Spring,
        [styles.seasonSummer]: season === CareSeason.Summer,
        [styles.seasonAutumn]: season === CareSeason.Autumn,
        [styles.seasonWinter]: season === CareSeason.Winter
    });

    return (
        <dl className={classes} {...props}>
            {[CareKind.Water, CareKind.Fertilize, CareKind.Repot].map((kind) => {
                const meta = CARE_META[kind];

                return (
                    <div key={kind} className={styles.careStat}>
                        <div className={styles.emoji}>
                            <meta.icon size="1.375rem" aria-hidden />
                        </div>
                        <dt className={styles.label}>
                            {meta.label}
                            {kind === CareKind.Water && (
                                <span aria-label={seasonMeta.label} className={seasonClasses} role="img">
                                    <SeasonIcon size="0.75rem" aria-hidden />
                                </span>
                            )}
                        </dt>
                        <dd>
                            <CareStatValue plant={plant} kind={kind} now={now} onRequestPotSize={handleRequestPotSize} />
                        </dd>
                    </div>
                );
            })}
        </dl>
    );
};

export default CareStats;
