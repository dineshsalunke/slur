import { useControls } from 'leva';
import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { grantButtons } from './pickup-grants.utils';

export function PickupGrants( { room }: { room: LoopbackRoom } ) {
    useControls( 'Pickups', () => grantButtons( room ), [ room ] );
    return null;
}
