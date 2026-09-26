import { minePickupCoreGeometry, minePickupGlyphGeometry, minePickupShellGeometry } from '../mine-look';
import { pickupBody } from '../pickup-body';
import type { PickupPart } from '../pickup-instances/pickup-instances';

export function buildMinePickup(): PickupPart[] {
    return pickupBody( minePickupShellGeometry(), minePickupGlyphGeometry(), minePickupCoreGeometry() );
}
