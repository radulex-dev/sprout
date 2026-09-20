import 'server-only';

// Helpers
import type { CareReference } from '@/helpers/care/types';

// Database
import { getCareReferenceRows } from '@/lib/db/queries';

// Types
import { CareMatchType, CareUnit, type CareSchedule } from '@/types';
import type { CareReferenceRow } from '@/lib/db/types';

const toDays = (interval: number, unit: CareUnit): number => {
    switch (unit) {
        case CareUnit.Days: {
            return interval;
        }
        case CareUnit.Months: {
            return interval * 30;
        }
        case CareUnit.Years: {
            return interval * 365;
        }
        default: {
            throw new Error('Unsupported care unit');
        }
    }
};

const toMonths = (interval: number, unit: CareUnit): number => {
    switch (unit) {
        case CareUnit.Days: {
            return Math.round(interval / 30);
        }
        case CareUnit.Months: {
            return interval;
        }
        case CareUnit.Years: {
            return interval * 12;
        }
        default: {
            throw new Error('Unsupported care unit');
        }
    }
};

const scheduleFrom = (row: CareReferenceRow): CareSchedule => {
    if (
        row.waterInterval === null
        || row.waterUnit === null
        || row.fertilizeInterval === null
        || row.fertilizeUnit === null
        || row.repotInterval === null
        || row.repotUnit === null
    ) {
        throw new Error(`Care reference row '${row.matchKey}' is missing a value or unit`);
    }

    return {
        waterEveryDays: toDays(row.waterInterval, row.waterUnit),
        fertilizeEveryDays: toDays(row.fertilizeInterval, row.fertilizeUnit),
        repotEveryMonths: toMonths(row.repotInterval, row.repotUnit)
    };
};

export const loadCareReference = async (): Promise<CareReference> => {
    const rows = await getCareReferenceRows();
    const reference: CareReference = {
        alias: {},
        family: {},
        genus: {}
    };

    for (const row of rows) {
        if (row.matchType === CareMatchType.Alias) {
            if (row.aliasTarget !== null) {
                reference.alias[row.matchKey] = row.aliasTarget;
            }

            continue;
        }

        if (row.matchType === CareMatchType.Genus) {
            reference.genus[row.matchKey] = scheduleFrom(row);

            continue;
        }

        reference.family[row.matchKey.toLowerCase()] = scheduleFrom(row);
    }

    return reference;
};
