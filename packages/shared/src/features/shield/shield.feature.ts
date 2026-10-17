import { HeldPower } from '../../combat/constants.js';
import { defineSimFeature, type SimFeature } from '../define-sim-feature.js';
import { SHIELD_POP_MESSAGE } from './shield-constants.js';
import { fireShield, resetShields, wardShields } from './shield-run.js';

export * from './shield-constants.js';
export { shieldAbsorbs } from './shield-run.js';
export * from './shield-status.js';

const SHIELD_FIELDS = {
    shielded: { type: 'boolean', default: false },
    shieldTimer: { type: 'float32', default: 0, sync: false },
} as const;

export const shieldFeature: SimFeature< typeof SHIELD_FIELDS > = defineSimFeature( {
    id: 'shield',
    power: { kind: HeldPower.shield, bagWeight: ( cfg ) => cfg.shieldRatio },
    fields: { player: SHIELD_FIELDS },
    run: {
        open: () => undefined,
        use: fireShield,
        ward: wardShields,
        reset: resetShields,
    },
    messages: [ SHIELD_POP_MESSAGE ],
} );
