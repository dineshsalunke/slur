import type { Anchor } from '@slur/shared';
import { boostPickupCoreGeometry, boostPickupGlyphGeometry, boostPickupShellGeometry } from './boost-look';
import { pickupBody } from './pickup-body';
import { PickupInstances, type PickupPart } from './pickup-instances';

function buildBoostPickup(): PickupPart[] {
    return pickupBody( boostPickupShellGeometry(), boostPickupGlyphGeometry(), boostPickupCoreGeometry() );
}

export function BoostPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildBoostPickup } />;
}
