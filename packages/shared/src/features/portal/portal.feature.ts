import { HeldPower } from '../../combat/constants.js';
import { defineSimFeature, type PlayerFieldSpec, type SimFeature } from '../define-sim-feature.js';
import { PORTAL_FIZZLE_MESSAGE, PORTAL_HOP_MESSAGE } from './portal-constants.js';
import { hopPortal, openPortalRun, resetPortals, settlePortals, tapPortal, usePortal } from './portal-run.js';

export * from './portal-constants.js';
export * from './portal-hop.js';
export * from './portal-place.js';
export {
    isDoubleTap,
    type PortalEnd,
    type PortalRun,
    type PortalTap,
    placePortal,
    stepPortals,
    throwPortalFar,
} from './portal-run.js';
export { Portal } from './portal-schema.js';

export const portalFeature: SimFeature< Record< never, PlayerFieldSpec > > = defineSimFeature( {
    id: 'portal',
    power: { kind: HeldPower.portal, uses: [ HeldPower.portalB ], bagWeight: ( cfg ) => cfg.portalRatio },
    run: {
        open: openPortalRun,
        tap: tapPortal,
        use: usePortal,
        hop: hopPortal,
        settle: settlePortals,
        reset: resetPortals,
    },
    messages: [ PORTAL_HOP_MESSAGE, PORTAL_FIZZLE_MESSAGE ],
} );
