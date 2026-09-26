import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import { pickupBody } from '../pickup-body';
import type { PickupPart } from '../pickup-instances/pickup-instances';
import {
    SEEKER_FLIGHT,
    SEEKER_PICKUP,
    type SeekerForm,
    seekerCoreGeometry,
    seekerGlyphGeometry,
    seekerShellGeometry,
} from '../seeker-look';
import type { PickupLayouts } from './seeker-pickups';

export function bucketOf( out: PickupLayouts, power: HeldPower ): Anchor[] {
    switch ( power ) {
        case HeldPower.seeker:
            return out.seekers;
        case HeldPower.mine:
            return out.mines;
        case HeldPower.boost:
            return out.boosts;
        case HeldPower.shield:
            return out.shields;
        case HeldPower.portal:
            return out.portals;
        default:
            return out.bolts;
    }
}

export function splitPickupLayout( layout: readonly Anchor[] ): PickupLayouts {
    const out: PickupLayouts = { bolts: [], seekers: [], mines: [], boosts: [], shields: [], portals: [] };
    for ( const a of layout ) bucketOf( out, pickupPower( a.id ) ).push( a );
    return out;
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
