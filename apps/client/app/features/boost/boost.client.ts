import { boostFeature } from '@slur/shared';
import { defineClientFeature } from '../../engine/define-client-feature';
import { BOOST_GLYPH } from './boost-glyph';
import { BoostPickups } from './boost-pickups/boost-pickups';
import { BoostStreaks } from './boost-streaks/boost-streaks';

export const boostClient = defineClientFeature( {
    id: 'boost',
    sim: boostFeature,
    views: { scene: BoostStreaks, pickups: BoostPickups },
    hud: { glyph: BOOST_GLYPH },
} );
