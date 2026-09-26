import { boltPickupCoreGeometry, boltPickupGlyphGeometry, boltPickupShellGeometry } from '../combat-look';
import { pickupBody } from '../pickup-body';
import type { PickupPart } from '../pickup-instances/pickup-instances';

export function buildBoltBody(): PickupPart[] {
    return pickupBody( boltPickupShellGeometry(), boltPickupGlyphGeometry(), boltPickupCoreGeometry() );
}
