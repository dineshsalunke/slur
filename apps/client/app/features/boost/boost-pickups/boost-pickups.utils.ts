import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import { pickupBody } from '../../../game/scene/pickup-body';
import type { PickupPart } from '../../../game/scene/pickup-instances/pickup-instances';
import { boostPickupCoreGeometry, boostPickupGlyphGeometry, boostPickupShellGeometry } from '../boost-look';

export function boostAnchors( layout: readonly Anchor[] ): Anchor[] {
    return layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.boost );
}

export function buildBoostPickup(): PickupPart[] {
    return pickupBody( boostPickupShellGeometry(), boostPickupGlyphGeometry(), boostPickupCoreGeometry() );
}
