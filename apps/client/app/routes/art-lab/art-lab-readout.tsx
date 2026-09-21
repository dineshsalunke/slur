import { addEffect } from '@react-three/fiber';
import {
    HALF_WIDTH,
    intensityAt,
    passableCorridorWidth,
    SEG_LEN,
    type SimShip,
    TRACK_SEGMENTS,
    type Track as TrackHandle,
} from '@slur/shared';
import { useWorld } from 'koota/react';
import { useEffect, useRef } from 'react';
import { LocalPlayer, Sim } from '../../game/ecs/traits';

const KIND: Record< string, string > = { plain: '·', block: 'BLK', gap: 'GAP', finish: 'FIN' };
const SAMPLE_MS = 120;

function band( intensity: number ): string {
    if ( intensity < 0.34 ) return 'A subtle';
    if ( intensity < 0.67 ) return 'B balanced';
    return 'C intense';
}

function shipState( s: { dead: boolean; grounded: boolean } ): string {
    if ( s.dead ) return 'DEAD';
    return s.grounded ? 'grounded' : 'air';
}

function aheadStrip( track: TrackHandle, z: number ): string {
    return [ 1, 2, 3, 4, 5, 6 ].map( ( n ) => KIND[ track.segmentAtZ( z + n * SEG_LEN ).kind ] ?? '?' ).join( ' ' );
}

function readoutLines( track: TrackHandle, s: SimShip ): string[] {
    const seg = track.segmentAtZ( s.z );
    const intensity = intensityAt( seg.index, TRACK_SEGMENTS );
    const corridor = passableCorridorWidth( seg );
    const width = 2 * HALF_WIDTH;
    return [
        `z ${ s.z.toFixed( 0 ) } / ${ track.finishZ }   seg ${ seg.index }/${ TRACK_SEGMENTS }  ${ seg.kind }`,
        `speed ${ s.vz.toFixed( 1 ) } u/s   x ${ s.x.toFixed( 1 ) }   ${ shipState( s ) }`,
        `intensity ${ intensity.toFixed( 2 ) }  → ${ band( intensity ) }`,
        `corridor ${ corridor.toFixed( 1 ) }u of ${ width }u  (${ ( ( corridor / width ) * 100 ).toFixed( 0 ) }% of ribbon)`,
        `ahead ${ aheadStrip( track, s.z ) }`,
    ];
}

export function ArtLabReadout( { track }: { track: TrackHandle } ) {
    const world = useWorld();
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — external sync: brackets a per-frame subscription to this component's mount, which
    useEffect( () => {
        let lastSample = 0;
        return addEffect( ( timestamp ) => {
            if ( timestamp - lastSample < SAMPLE_MS ) return;
            lastSample = timestamp;
            const el = ref.current;
            if ( ! el ) return;
            const s = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
            if ( ! s ) return;
            el.textContent = readoutLines( track, s ).join( '\n' );
        } );
    }, [ world, track ] );

    return (
        <div
            ref={ ref }
            className="pointer-events-none fixed bottom-4 left-4 z-10 whitespace-pre rounded bg-black/70 px-3 py-2 font-mono text-[12px] leading-relaxed text-cyan-300"
        />
    );
}
