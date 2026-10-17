import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import { pickupBody } from '../../../game/scene/pickup-body';
import type { PickupPart } from '../../../game/scene/pickup-instances/pickup-instances';
import { minePickupCoreGeometry, minePickupGlyphGeometry, minePickupShellGeometry } from '../mine-look';

export function mineAnchors( layout: readonly Anchor[] ): Anchor[] {
    return layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.mine );
}

export function buildMinePickup(): PickupPart[] {
    return pickupBody( minePickupShellGeometry(), minePickupGlyphGeometry(), minePickupCoreGeometry() );
}
