import { exhaustPorts } from '../exhaust-ports';

export function portTailZ( shipId: string ): number {
    const ports = exhaustPorts( shipId );
    if ( ! ports ) return 0;
    let tail = 0;
    for ( const port of ports ) tail = Math.min( tail, port.z );
    return tail;
}
