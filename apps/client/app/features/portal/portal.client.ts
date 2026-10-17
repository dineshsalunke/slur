import {
    HeldPower,
    PORTAL_FIZZLE_MESSAGE,
    PORTAL_HOP_MESSAGE,
    type PortalFizzleMessage,
    type PortalHopMessage,
    portalFeature,
} from '@slur/shared';
import { defineClientFeature } from '../../engine/define-client-feature';
import { blockWorld } from '../../game/block-state';
import { burstPortalHop, pushMineShock } from '../../game/scene/mine-shock-events';
import { PortalField } from './portal-field/portal-field';
import { PORTAL_B_GLYPH, PORTAL_GLYPH } from './portal-glyph';
import { PortalPickups } from './portal-pickups/portal-pickups';

export const portalClient = defineClientFeature( {
    id: 'portal',
    sim: portalFeature,
    views: { scene: PortalField, pickups: PortalPickups },
    hud: { glyph: PORTAL_GLYPH, glyphs: { [ HeldPower.portalB ]: PORTAL_B_GLYPH } },
    net: {
        [ PORTAL_HOP_MESSAGE ]: ( m: PortalHopMessage, net ) => {
            if ( m.victimId === net.sessionId ) return;
            burstPortalHop( { x: m.fromX, y: m.fromY, z: m.fromZ }, m, blockWorld.portals.values() );
        },
        [ PORTAL_FIZZLE_MESSAGE ]: ( m: PortalFizzleMessage ) =>
            pushMineShock( { x: m.x, y: m.y, z: m.z, kind: 'fizzle' } ),
    },
} );
