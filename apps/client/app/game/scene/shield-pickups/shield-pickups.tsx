import type { Anchor } from '@slur/shared';
import { PickupInstances } from '../pickup-instances/pickup-instances';
import { buildShieldPickup } from './shield-pickups.utils';

export function ShieldPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildShieldPickup } />;
}
