import type { LucideIcon } from 'lucide-react';

// Types
import type { CareKind, Plant } from '@/types';

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
    gerund: string;
    icon: LucideIcon;
}

export interface CareNotification {
    title: string;
    body: string;
    tag: string;
}
