import { type Anchor, HeldPower, pickupPower } from '@slur/shared';
import { pickupBody } from './pickup-body';
import { PickupInstances, type PickupPart } from './pickup-instances';
import {
    SEEKER_FLIGHT,
    SEEKER_PICKUP,
    type SeekerForm,
    seekerCoreGeometry,
    seekerGlyphGeometry,
    seekerShellGeometry,
} from './seeker-look';

export interface PickupLayouts {
    bolts: Anchor[];
    seekers: Anchor[];
    mines: Anchor[];
    boosts: Anchor[];
    shields: Anchor[];
}

function bucketOf( out: PickupLayouts, power: HeldPower ): Anchor[] {
    switch ( power ) {
        case HeldPower.seeker:
            return out.seekers;
        case HeldPower.mine:
            return out.mines;
        case HeldPower.boost:
            return out.boosts;
        case HeldPower.shield:
            return out.shields;
        default:
            return out.bolts;
    }
}

export function splitPickupLayout( layout: readonly Anchor[] ): PickupLayouts {
    const out: PickupLayouts = { bolts: [], seekers: [], mines: [], boosts: [], shields: [] };
    for ( const a of layout ) bucketOf( out, pickupPower( a.id ) ).push( a );
    return out;
}

function seekerParts( form: SeekerForm ): PickupPart[] {
    return pickupBody( seekerShellGeometry( form ), seekerGlyphGeometry( form ), seekerCoreGeometry( form ) );
}

export function buildSeekerBody(): PickupPart[] {
    return seekerParts( SEEKER_FLIGHT );
}

function buildSeekerPickup(): PickupPart[] {
    return seekerParts( SEEKER_PICKUP );
}

export function SeekerPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildSeekerPickup } />;
}
