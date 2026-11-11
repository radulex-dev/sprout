// Types
import type { CareReference } from '@/helpers/care/types';

export const careReference: CareReference = {
    alias: {
        'calathea': 'goeppertia',
        'dracaena trifasciata': 'sansevieria'
    },
    family: {
        urticaceae: {
            waterEveryDaysSpring: 6,
            waterEveryDaysSummer: 6,
            waterEveryDaysAutumn: 6,
            waterEveryDaysWinter: 6,
            waterAmountMl: 0,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        }
    },
    genus: {
        dracaena: {
            waterEveryDaysSpring: 10,
            waterEveryDaysSummer: 10,
            waterEveryDaysAutumn: 10,
            waterEveryDaysWinter: 10,
            waterAmountMl: 0,
            fertilizeEveryDays: 30,
            repotEveryMonths: 30
        },
        goeppertia: {
            waterEveryDaysSpring: 4,
            waterEveryDaysSummer: 4,
            waterEveryDaysAutumn: 4,
            waterEveryDaysWinter: 4,
            waterAmountMl: 0,
            fertilizeEveryDays: 21,
            repotEveryMonths: 12
        },
        monstera: {
            waterEveryDaysSpring: 5,
            waterEveryDaysSummer: 5,
            waterEveryDaysAutumn: 5,
            waterEveryDaysWinter: 5,
            waterAmountMl: 0,
            fertilizeEveryDays: 30,
            repotEveryMonths: 18
        },
        sansevieria: {
            waterEveryDaysSpring: 21,
            waterEveryDaysSummer: 21,
            waterEveryDaysAutumn: 21,
            waterEveryDaysWinter: 21,
            waterAmountMl: 0,
            fertilizeEveryDays: 90,
            repotEveryMonths: 30
        }
    }
};
