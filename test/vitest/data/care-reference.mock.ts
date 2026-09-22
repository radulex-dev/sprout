// Types
import type { CareReference } from '@/helpers/care/types';

export const careReference: CareReference = {
    alias: {
        'calathea': 'goeppertia',
        'dracaena trifasciata': 'sansevieria'
    },
    family: {
        urticaceae: {
            waterEveryDays: 6,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        }
    },
    genus: {
        dracaena: {
            waterEveryDays: 10,
            fertilizeEveryDays: 30,
            repotEveryMonths: 30
        },
        goeppertia: {
            waterEveryDays: 4,
            fertilizeEveryDays: 21,
            repotEveryMonths: 12
        },
        monstera: {
            waterEveryDays: 5,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        },
        sansevieria: {
            waterEveryDays: 21,
            fertilizeEveryDays: 90,
            repotEveryMonths: 30
        }
    }
};
