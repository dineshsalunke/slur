import { type Anchor, HeldPower, pickupPower } from '@slur/shared';

export interface PickupLayouts {
    mines: Anchor[];
    boosts: Anchor[];
    shields: Anchor[];
    portals: Anchor[];
}

export function bucketOf( out: PickupLayouts, power: HeldPower ): Anchor[] | null {
    switch ( power ) {
        case HeldPower.mine:
            return out.mines;
        case HeldPower.boost:
            return out.boosts;
        case HeldPower.shield:
            return out.shields;
        case HeldPower.portal:
            return out.portals;
        default:
            return null;
    }
}

export function splitPickupLayout( layout: readonly Anchor[] ): PickupLayouts {
    const out: PickupLayouts = { mines: [], boosts: [], shields: [], portals: [] };
    for ( const a of layout ) bucketOf( out, pickupPower( a.id ) )?.push( a );
    return out;
}
