import { HeldPower } from '@slur/shared';

export const GRANTABLE_POWERS = [
    [ 'bolt', HeldPower.bolt ],
    [ 'seeker', HeldPower.seeker ],
    [ 'mine', HeldPower.mine ],
    [ 'boost', HeldPower.boost ],
    [ 'shield', HeldPower.shield ],
    [ 'portal', HeldPower.portal ],
    [ 'tug', HeldPower.tug ],
] as const;
