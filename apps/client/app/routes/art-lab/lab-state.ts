export const labControls = {
    paused: false,
    ghost: false,
    ghostSpeed: 55,
};

import type { ShipId } from '@slur/shared';

export const labCommands = {
    jumpToZ: null as number | null,
    setShip: null as ShipId | null,
};
