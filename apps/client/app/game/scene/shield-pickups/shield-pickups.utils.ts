import { pickupBody } from '../pickup-body';
import type { PickupPart } from '../pickup-instances';
import { shieldPickupCoreGeometry, shieldPickupGlyphGeometry, shieldPickupShellGeometry } from '../shield-look';

export function buildShieldPickup(): PickupPart[] {
    return pickupBody( shieldPickupShellGeometry(), shieldPickupGlyphGeometry(), shieldPickupCoreGeometry() );
}
