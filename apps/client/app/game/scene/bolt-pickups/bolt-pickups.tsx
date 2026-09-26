import type { Anchor } from '@slur/shared';
import { PickupInstances } from '../pickup-instances/pickup-instances';
import { buildBoltBody } from './bolt-pickups.utils';

export function BoltPickups( { layout, isTaken }: { layout: Anchor[]; isTaken: ( id: string ) => boolean } ) {
    return <PickupInstances layout={ layout } isTaken={ isTaken } buildBody={ buildBoltBody } />;
}
