import type { LucideIcon } from 'lucide-react';

// Types
import type { CareKind, CareSchedule, CareSource, Plant } from '@/types';

export interface CareTask {
    plant: Plant;
    kind: CareKind;
    dueAt: number;
    /** Days relative to today: negative = overdue. */
    daysUntil: number;
}

export interface CareMeta {
    label: string;
    verb: string;
    icon: LucideIcon;
}

export interface CareReference {
    alias: Record<string, string>;
    family: Record<string, CareSchedule>;
    genus: Record<string, CareSchedule>;
}

export interface CareLookup {
    genus?: string;
    species?: string;
    family?: string;
}

export interface ResolvedCare {
    care: CareSchedule;
    source: CareSource;
}
