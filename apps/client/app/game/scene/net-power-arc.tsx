import { useRoom } from '../../net/room-context/use-room';
import { useSelfSpectating } from '../net/standings-store';
import { PowerArc } from './power-arc/power-arc';

export function NetPowerArc() {
    const spectating = useSelfSpectating( useRoom() );
    return spectating ? null : <PowerArc />;
}
