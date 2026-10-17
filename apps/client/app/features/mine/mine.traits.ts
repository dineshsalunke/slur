import { trait } from 'koota';

export const NetMine = trait( {
    x: 0,
    y: 0,
    z: 0,
    armed: false,
    bornAt: Number.NEGATIVE_INFINITY,
    fromX: 0,
    fromY: 0,
    fromZ: 0,
    dir: 1,
} );
