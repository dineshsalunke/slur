import type { LoopbackRoom } from '../../../net/loopback-room/loopback-room';
import { useResetKeys } from './use-reset-keys';

export function ResetKey( { room }: { room: LoopbackRoom } ) {
    useResetKeys( room );
    return null;
}
