import { MINE_BURST_MESSAGE, mineFeature } from '@slur/shared';
import { defineClientFeature } from '../../engine/define-client-feature';
import { burstMine } from './mine-burst';
import { MineField } from './mine-field/mine-field';
import { MINE_GLYPH } from './mine-glyph';
import { MinePickups } from './mine-pickups/mine-pickups';

export const mineClient = defineClientFeature( {
    id: 'mine',
    sim: mineFeature,
    views: { scene: MineField, pickups: MinePickups },
    hud: { glyph: MINE_GLYPH },
    net: { [ MINE_BURST_MESSAGE ]: burstMine },
} );
