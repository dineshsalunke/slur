import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useSelfSpectating } from '../net/standings-store';
import { PowerRack } from './power-rack/power-rack';

export function NetPowerRack( { room }: { room: Room< RunState > } ) {
    const spectating = useSelfSpectating( room );
    return spectating ? null : <PowerRack />;
}
