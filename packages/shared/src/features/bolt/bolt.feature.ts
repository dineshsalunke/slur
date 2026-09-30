import { HeldPower } from '../../combat/constants.js';
import { defineSimFeature, type PlayerFieldSpec, type SimFeature } from '../define-sim-feature.js';
import { fireBolt, strikeBolts } from './bolt-run.js';

export {
    aimBolt,
    type BoltGunner,
    type BoltOutcome,
    type BoltStrike,
    boltBlockHit,
    boltHits,
    resolveBolt,
    stepBolts,
    stepProjectiles,
} from './bolt.js';
export { BOLT_HALF, BOLT_SPAWN_AHEAD, BOLT_SPEED, BOLT_TTL } from './bolt-constants.js';

export const boltFeature: SimFeature< Record< never, PlayerFieldSpec > > = defineSimFeature( {
    id: 'bolt',
    power: { kind: HeldPower.bolt, bagRest: true },
    run: {
        open: () => undefined,
        use: fireBolt,
        strike: strikeBolts,
    },
} );
