import { type Anchor, HeldPower, pickupPower } from '@slur/shared';

export interface PickupLayouts {
    portals: Anchor[];
}

export function bucketOf( out: PickupLayouts, power: HeldPower ): Anchor[] | null {
    switch ( power ) {
        case HeldPower.portal:
            return out.portals;
        default:
            return null;
    }
}

export function splitPickupLayout( layout: readonly Anchor[] ): PickupLayouts {
    const out: PickupLayouts = { portals: [] };
    for ( const a of layout ) bucketOf( out, pickupPower( a.id ) )?.push( a );
    return out;
}
