import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import { pickupBody } from '../../../game/scene/pickup-body';
import type { PickupPart } from '../../../game/scene/pickup-instances/pickup-instances';
import {
    SEEKER_FLIGHT,
    SEEKER_PICKUP,
    type SeekerForm,
    seekerCoreGeometry,
    seekerGlyphGeometry,
    seekerShellGeometry,
} from '../seeker-look';

export function seekerAnchors( layout: readonly Anchor[] ): Anchor[] {
    return layout.filter( ( a ) => pickupPower( a.id ) === HeldPower.seeker );
}

export function seekerParts( form: SeekerForm ): PickupPart[] {
    return pickupBody( seekerShellGeometry( form ), seekerGlyphGeometry( form ), seekerCoreGeometry( form ) );
}

export function buildSeekerBody(): PickupPart[] {
    return seekerParts( SEEKER_FLIGHT );
}

export function buildSeekerPickup(): PickupPart[] {
    return seekerParts( SEEKER_PICKUP );
}
