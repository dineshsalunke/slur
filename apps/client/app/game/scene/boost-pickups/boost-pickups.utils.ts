import { boostPickupCoreGeometry, boostPickupGlyphGeometry, boostPickupShellGeometry } from '../boost-look';
import { pickupBody } from '../pickup-body';
import type { PickupPart } from '../pickup-instances/pickup-instances';

export function buildBoostPickup(): PickupPart[] {
    return pickupBody( boostPickupShellGeometry(), boostPickupGlyphGeometry(), boostPickupCoreGeometry() );
}
