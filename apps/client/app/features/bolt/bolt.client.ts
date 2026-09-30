import { boltFeature } from '@slur/shared';
import { defineClientFeature } from '../../engine/define-client-feature';
import { BOLT_GLYPH } from './bolt-glyph';
import { BoltPickups } from './bolt-pickups/bolt-pickups';

export const boltClient = defineClientFeature( {
    id: 'bolt',
    sim: boltFeature,
    views: { pickups: BoltPickups },
    hud: { glyph: BOLT_GLYPH },
} );
