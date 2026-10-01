import { HeldPower } from '../../combat/constants.js';
import { defineSimFeature, type PlayerFieldSpec, type SimFeature } from '../define-sim-feature.js';
import { SEEKER_HIT_MESSAGE, SEEKER_MISS_MESSAGE } from './seeker-constants.js';
import { fireSeeker, strikeSeekers } from './seeker-run.js';

export {
    aimSeeker,
    inTerminalWindow,
    type SeekerEvent,
    type SeekerOutcome,
    type SeekerShooter,
    type SeekerState,
    seekerTopSpeed,
    stepSeeker,
    stepSeekers,
} from './seeker.js';
export * from './seeker-constants.js';
export { Seeker } from './seeker-schema.js';

export const seekerFeature: SimFeature< Record< never, PlayerFieldSpec > > = defineSimFeature( {
    id: 'seeker',
    power: { kind: HeldPower.seeker, bagWeight: ( cfg ) => cfg.seekerRatio },
    run: {
        open: () => undefined,
        use: fireSeeker,
        strike: strikeSeekers,
    },
    messages: [ SEEKER_HIT_MESSAGE, SEEKER_MISS_MESSAGE ],
} );
