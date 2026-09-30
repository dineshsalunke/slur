import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import {
    boltPickupCoreGeometry,
    boltPickupGlyphGeometry,
    boltPickupShellGeometry,
} from '../../../game/scene/combat-look';
import { pickupBody } from '../../../game/scene/pickup-body';
import type { PickupPart } from '../../../game/scene/pickup-instances/pickup-instances';

export function boltAnchors( layout: readonly Anchor[] ): Anchor[] {
    return layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.bolt );
}

export function buildBoltBody(): PickupPart[] {
    return pickupBody( boltPickupShellGeometry(), boltPickupGlyphGeometry(), boltPickupCoreGeometry() );
}
