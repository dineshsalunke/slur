import { usePanelShown } from '../../../dev/panel-visibility';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { PickupGrants } from './pickup-grants';

export function PickupGrantsMount( { room }: { room: LoopbackRoom } ) {
    const shown = usePanelShown();
    if ( ! shown ) return null;
    return <PickupGrants room={ room } />;
}
