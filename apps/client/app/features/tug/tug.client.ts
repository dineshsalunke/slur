import { TUG_MESSAGE, type TugEvent, tugFeature } from '@slur/shared';
import { defineClientFeature } from '../../engine/define-client-feature';
import { playTugEvent } from './tug-audio';
import { pushTug } from './tug-events';
import { TUG_GLYPH } from './tug-glyph';
import { TugLine } from './tug-line/tug-line';
import { TugPickups } from './tug-pickups/tug-pickups';

export const tugClient = defineClientFeature( {
    id: 'tug',
    sim: tugFeature,
    views: { scene: TugLine, pickups: TugPickups },
    hud: { glyph: TUG_GLYPH },
    net: {
        [ TUG_MESSAGE ]: ( e: TugEvent, net ) => {
            pushTug( e );
            playTugEvent( e, net.sessionId );
        },
    },
} );
