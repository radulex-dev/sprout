// Types
import { CareSource } from '@/types';

export const NICKNAME_LABEL = 'Nickname';
export const NICKNAME_PLACEHOLDER = 'e.g. Kitchen monstera';

export const CARE_HINT_GENUS = 'Suggested from care data for this plant — adjust to suit.';
export const CARE_HINT_FAMILY = 'No species-specific data for this plant. These are typical values for its family — adjust to suit.';
export const CARE_HINT_NONE = 'We don\'t have care data for this plant. Set the frequencies yourself.';

export const CARE_HINT_BY_SOURCE: Record<CareSource, string> = {
    [CareSource.Genus]: CARE_HINT_GENUS,
    [CareSource.Family]: CARE_HINT_FAMILY,
    [CareSource.None]: CARE_HINT_NONE
};
