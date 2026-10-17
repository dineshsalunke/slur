import { HeldPower } from '../../combat/constants.js';
import { defineSimFeature, type PlayerFieldSpec, type SimFeature } from '../define-sim-feature.js';
import { MINE_BURST_MESSAGE } from './mine-constants.js';
import { layMine, settleMines } from './mine-run.js';

export {
    aimMine,
    evictOldest,
    type MineHull,
    type MineLayer,
    mineDropZ,
    mineFizzle,
    mineTriggers,
    stepMines,
} from './mine.js';
export * from './mine-constants.js';
export { resolveMineEvent } from './mine-run.js';
export { Mine } from './mine-schema.js';

export const mineFeature: SimFeature< Record< never, PlayerFieldSpec > > = defineSimFeature( {
    id: 'mine',
    power: { kind: HeldPower.mine, bagWeight: ( cfg ) => cfg.mineRatio },
    run: {
        open: () => undefined,
        use: layMine,
        settle: settleMines,
    },
    messages: [ MINE_BURST_MESSAGE ],
} );
