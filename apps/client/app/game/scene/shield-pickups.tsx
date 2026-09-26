import type { Anchor } from '@slur/shared';
import { pickupBody } from './pickup-body';
import { PickupInstances, type PickupPart } from './pickup-instances';
import { shieldPickupCoreGeometry, shieldPickupGlyphGeometry, shieldPickupShellGeometry } from './shield-look';

function buildShieldPickup(): PickupPart[] {
    return pickupBody( shieldPickupShellGeometry(), shieldPickupGlyphGeometry(), shieldPickupCoreGeometry() );
}

export function ShieldPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildShieldPickup } />;
}
