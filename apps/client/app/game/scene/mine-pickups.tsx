import type { Anchor } from '@slur/shared';
import { minePickupCoreGeometry, minePickupGlyphGeometry, minePickupShellGeometry } from './mine-look';
import { pickupBody } from './pickup-body';
import { PickupInstances, type PickupPart } from './pickup-instances';

function buildMinePickup(): PickupPart[] {
    return pickupBody( minePickupShellGeometry(), minePickupGlyphGeometry(), minePickupCoreGeometry() );
}

export function MinePickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildMinePickup } />;
}
