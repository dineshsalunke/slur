import type { Anchor } from '@slur/shared';
import { PickupInstances } from '../pickup-instances/pickup-instances';
import { buildMinePickup } from './mine-pickups.utils';

export function MinePickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildMinePickup } />;
}
