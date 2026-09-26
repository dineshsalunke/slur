import type { Anchor } from '@slur/shared';
import { PickupInstances } from '../pickup-instances/pickup-instances';
import { buildSeekerPickup } from './seeker-pickups.utils';

export interface PickupLayouts {
    bolts: Anchor[];
    seekers: Anchor[];
    mines: Anchor[];
    boosts: Anchor[];
    shields: Anchor[];
}

export function SeekerPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildSeekerPickup } />;
}
