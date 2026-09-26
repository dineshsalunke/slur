import type { Anchor } from '@slur/shared';
import { boltPickupCoreGeometry, boltPickupGlyphGeometry, boltPickupShellGeometry } from './combat-look';
import { pickupBody } from './pickup-body';
import { PickupInstances, type PickupPart } from './pickup-instances';

function buildBoltBody(): PickupPart[] {
    return pickupBody( boltPickupShellGeometry(), boltPickupGlyphGeometry(), boltPickupCoreGeometry() );
}

export function BoltPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildBoltBody } />;
}
