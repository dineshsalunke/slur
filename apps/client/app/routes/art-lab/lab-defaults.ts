import type { ShipId } from '@slur/shared';

// Deliberately NOT `DEFAULT_SHIP` — that decides what every real player flies and must not move to suit a
// lab. Read by BOTH seeds, which are independent: the picker's highlighted button in `art-lab-controls.tsx`
// and the entity the rig mounts in `art-lab-rig.tsx`. If they disagree the highlight lies about what is on
// screen.
export const LAB_DEFAULT_SHIP: ShipId = 'split-crown';
