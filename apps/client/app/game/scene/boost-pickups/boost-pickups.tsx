import type { Anchor } from '@slur/shared';
import { PickupInstances } from '../pickup-instances/pickup-instances';
import { buildBoostPickup } from './boost-pickups.utils';

export function BoostPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildBoostPickup } />;
}
