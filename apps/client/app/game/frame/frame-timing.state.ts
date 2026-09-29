const SAMPLES = 120;

interface Ring {
    values: Float64Array;
    next: number;
    count: number;
}

const systemRings = new Map< string, Ring >();
const phaseRings = new Map< string, Ring >();

function push( rings: Map< string, Ring >, key: string, ms: number ): void {
    let ring = rings.get( key );
    if ( ! ring ) {
        ring = { values: new Float64Array( SAMPLES ), next: 0, count: 0 };
        rings.set( key, ring );
    }
    ring.values[ ring.next ] = ms;
    ring.next = ( ring.next + 1 ) % SAMPLES;
    if ( ring.count < SAMPLES ) ring.count++;
}

function median( ring: Ring ): number {
    const sorted = ring.values.slice( 0, ring.count ).sort();
    const mid = sorted.length >> 1;
    return sorted.length % 2 === 1 ? sorted[ mid ] : ( sorted[ mid - 1 ] + sorted[ mid ] ) / 2;
}

function readMedians( rings: Map< string, Ring >, out: Map< string, number > ): void {
    out.clear();
    for ( const [ key, ring ] of rings ) out.set( key, median( ring ) );
}

export function recordSystemTime( id: string, ms: number ): void {
    push( systemRings, id, ms );
}

export function recordPhaseTime( phase: string, ms: number ): void {
    push( phaseRings, phase, ms );
}

export function readSystemMedians( out: Map< string, number > ): void {
    readMedians( systemRings, out );
}

export function readPhaseMedians( out: Map< string, number > ): void {
    readMedians( phaseRings, out );
}
