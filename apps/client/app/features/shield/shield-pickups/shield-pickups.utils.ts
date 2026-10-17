import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import { pickupBody } from '../../../game/scene/pickup-body';
import type { PickupPart } from '../../../game/scene/pickup-instances/pickup-instances';
import { shieldPickupCoreGeometry, shieldPickupGlyphGeometry, shieldPickupShellGeometry } from '../shield-look';

export function shieldAnchors( layout: readonly Anchor[] ): Anchor[] {
    return layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.shield );
}

export function buildShieldPickup(): PickupPart[] {
    return pickupBody( shieldPickupShellGeometry(), shieldPickupGlyphGeometry(), shieldPickupCoreGeometry() );
}
