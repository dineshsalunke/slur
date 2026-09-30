import { HeldPower } from '../../combat/constants.js';
import { defineSimFeature, type SimFeature } from '../define-sim-feature.js';
import { TUG_MESSAGE } from './tug-constants.js';
import { clearTugThrows, fireTug, stepTugThrows, type TugThrow } from './tug-run.js';
import { clearTugStatus, tickTugStatus, towedInput, tugCap, tugThrust } from './tug-status.js';

export type { TugEvent, TugOutcome } from './tug.js';
export { TUG_MESSAGE } from './tug-constants.js';

const TUG_FLOAT = { type: 'float32', default: 0, sim: true } as const;

const TUG_FIELDS = { tugTimer: TUG_FLOAT, slowTimer: TUG_FLOAT, towTimer: TUG_FLOAT, tugAnchorZ: TUG_FLOAT } as const;

export const tugFeature: SimFeature< typeof TUG_FIELDS > = defineSimFeature( {
    id: 'tug',
    power: { kind: HeldPower.tug, bagWeight: ( cfg ) => cfg.tugRatio },
    fields: { player: TUG_FIELDS },
    ship: { input: towedInput, thrust: tugThrust, cap: tugCap, tick: tickTugStatus, clear: clearTugStatus },
    run: {
        open: (): TugThrow[] => [],
        use: fireTug,
        tick: stepTugThrows,
        reset: clearTugThrows,
    },
    messages: [ TUG_MESSAGE ],
} );
