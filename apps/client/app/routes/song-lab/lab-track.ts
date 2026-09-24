import { resolveTrack, type Track } from '@slur/shared';
import type { LabVariant } from './lab-bundle';

export function buildLabTrack( variant: LabVariant ): Track {
    return resolveTrack( variant.track );
}
