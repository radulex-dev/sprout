import { Droplets, Flower2, Leaf, type LucideIcon } from 'lucide-react';

// Types
import { CareKind } from '@/types';

export const CARE_ICONS: Record<CareKind, LucideIcon> = {
    [CareKind.Water]: Droplets,
    [CareKind.Fertilize]: Leaf,
    [CareKind.Repot]: Flower2
};
