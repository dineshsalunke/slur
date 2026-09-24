import { round3, type SongClock, type TakeAudio, type TakeSong } from './take-format';

const LEAD_S = 0.1;

let ctx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let source: AudioBufferSourceNode | null = null;
let startPerf = 0;
let clock: SongClock = 'current-time';

function hex( digest: ArrayBuffer ): string {
    return Array.from( new Uint8Array( digest ), ( b ) => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );
}

export async function loadSong( file: File ): Promise< TakeSong > {
    const data = await file.arrayBuffer();
    const sha256 = hex( await crypto.subtle.digest( 'SHA-256', data ) );
    ctx ??= new AudioContext();
    buffer = await ctx.decodeAudioData( data );
    return { name: file.name, bytes: file.size, sha256, durationS: round3( buffer.duration ) };
}

export async function playSong( onEnded: () => void ): Promise< void > {
    if ( ! ctx || ! buffer ) throw new Error( 'no song loaded' );
    await ctx.resume();
    source = new AudioBufferSourceNode( ctx, { buffer } );
    source.connect( ctx.destination );
    source.onended = onEnded;
    const at = ctx.currentTime + LEAD_S;
    source.start( at );
    const ts = ctx.getOutputTimestamp();
    if ( ts.contextTime && ts.performanceTime ) {
        clock = 'output-timestamp';
        startPerf = ts.performanceTime + ( at - ts.contextTime ) * 1000;
    } else {
        clock = 'current-time';
        startPerf = performance.now() + ( LEAD_S + ctx.baseLatency + ctx.outputLatency ) * 1000;
    }
}

export function stopSong(): void {
    if ( ! source ) return;
    source.onended = null;
    source.stop();
    source.disconnect();
    source = null;
}

export function songMs( perfNow: number ): number {
    return perfNow - startPerf;
}

export function songAudio(): TakeAudio {
    return { clock, baseLatencyS: ctx?.baseLatency ?? 0, outputLatencyS: ctx?.outputLatency ?? 0 };
}
