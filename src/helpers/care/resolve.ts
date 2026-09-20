// Constants
import { FALLBACK_CARE } from './constants';

// Types
import { CareSource } from '@/types';
import type { CareLookup, CareReference, ResolvedCare } from './types';

export const resolveCare = (reference: CareReference, lookup: CareLookup): ResolvedCare => {
    const species = lookup.species?.toLowerCase().trim();
    const genus = lookup.genus?.toLowerCase().trim();
    const speciesAlias = species ? reference.alias[species] : undefined;
    const genusAlias = genus ? reference.alias[genus] : undefined;
    const genusKey = speciesAlias ?? genusAlias ?? genus;
    const genusCare = genusKey ? reference.genus[genusKey] : undefined;

    if (genusCare) {
        return {
            care: genusCare,
            source: CareSource.Genus
        };
    }

    const family = lookup.family?.toLowerCase().trim();
    const familyCare = family ? reference.family[family] : undefined;

    if (familyCare) {
        return {
            care: familyCare,
            source: CareSource.Family
        };
    }

    return {
        care: FALLBACK_CARE,
        source: CareSource.None
    };
};
