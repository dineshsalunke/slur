import type { RunRoomLike } from '../../net/run-room-like';
import { useSelfSpectating } from '../net/standings-store';
import { PowerRack } from './power-rack/power-rack';

export function NetPowerRack( { room }: { room: RunRoomLike } ) {
    const spectating = useSelfSpectating( room );
    return spectating ? null : <PowerRack />;
}
