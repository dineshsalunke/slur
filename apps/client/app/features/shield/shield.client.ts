import { type HitMessage, SHIELD_POP_MESSAGE, shieldFeature } from '@slur/shared';
import { defineClientFeature } from '../../engine/define-client-feature';
import { pushHit } from '../../game/scene/hit-events';
import { ShieldDome } from './shield-dome/shield-dome';
import { SHIELD_GLYPH } from './shield-glyph';
import { popShield } from './shield-mirror';
import { ShieldPickups } from './shield-pickups/shield-pickups';

export const shieldClient = defineClientFeature( {
    id: 'shield',
    sim: shieldFeature,
    views: { pickups: ShieldPickups, ship: ShieldDome },
    hud: { glyph: SHIELD_GLYPH },
    net: {
        [ SHIELD_POP_MESSAGE ]: ( m: HitMessage, net ) => {
            popShield( net.entityOf( m.victimId ) );
            pushHit( { x: m.x, y: m.y, z: m.z } );
        },
    },
} );
