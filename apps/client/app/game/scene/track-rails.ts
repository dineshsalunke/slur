import { HALF_WIDTH, isFullSpan, LEAD_SEGMENTS, type Segment, type Track } from '@slur/shared';
import * as THREE from 'three';
import { accent } from './accent';
import { EMITTER_SLOTS, type EmitterUniforms, parkEmitter, writeEmitter } from './emitter-array';
import { isOuterEdge, RAIL_W } from './track-geometry';
import { RAIL_EMITTER_LIFT } from './track-materials';

export interface RailRun {
    x: number;
    y: number;
    z0: number;
    z1: number;
}

function edgeHeight( seg: Segment, left: boolean ): number | null {
    for ( const f of seg.floors ) {
        if ( ! isFullSpan( f ) ) continue;
        const x = left ? f.x0 : f.x1;
        if ( isOuterEdge( x ) && ( left ? x < 0 : x > 0 ) ) return f.y;
    }
    return null;
}

export function buildRailRuns( track: Track, segments: number ): RailRun[] {
    const runs: RailRun[] = [];
    const open: ( RailRun | null )[] = [ null, null ];

    for ( let i = -LEAD_SEGMENTS; i < segments; i++ ) {
        const seg = track.segmentAt( i );
        for ( let side = 0; side < 2; side++ ) {
            const left = side === 0;
            const y = edgeHeight( seg, left );
            if ( y === null ) {
                open[ side ] = null;
                continue;
            }
            const cur = open[ side ];
            if ( cur && Math.abs( cur.z1 - seg.z0 ) < 1e-4 && Math.abs( cur.y - y ) < 1e-4 ) {
                cur.z1 = seg.z1;
                continue;
            }
            const x = ( left ? -1 : 1 ) * ( HALF_WIDTH + RAIL_W / 2 );
            const run = { x, y, z0: seg.z0, z1: seg.z1 };
            runs.push( run );
            open[ side ] = run;
        }
    }

    return runs;
}

export function railRunDistance( run: RailRun, z: number ): number {
    if ( z < run.z0 ) return run.z0 - z;
    if ( z > run.z1 ) return z - run.z1;
    return 0;
}

const RAIL_COLOR = accent();
const _world = new THREE.Vector3();
const _near: RailRun[] = [];
const _dist: number[] = [];

function selectNearest( runs: RailRun[], z: number, limit: number ): number {
    let n = 0;
    for ( const run of runs ) {
        const d = railRunDistance( run, z );
        let at = n;
        while ( at > 0 && _dist[ at - 1 ] > d ) at--;
        if ( at >= limit ) continue;
        for ( let k = Math.min( n, limit - 1 ); k > at; k-- ) {
            _near[ k ] = _near[ k - 1 ];
            _dist[ k ] = _dist[ k - 1 ];
        }
        _near[ at ] = run;
        _dist[ at ] = d;
        if ( n < limit ) n++;
    }
    return n;
}

export function feedRailEmitters(
    uniforms: EmitterUniforms,
    runs: RailRun[],
    z: number,
    intensity: number,
    range: number,
): void {
    const n = selectNearest( runs, z, EMITTER_SLOTS );
    let slot = 0;
    for ( let i = 0; i < n; i++ ) {
        const run = _near[ i ];
        const z0 = Math.max( run.z0, z - range );
        const z1 = Math.min( run.z1, z + range );
        if ( z1 <= z0 ) continue;
        _world.set( run.x, run.y + RAIL_EMITTER_LIFT, ( z0 + z1 ) / 2 );
        writeEmitter( uniforms, slot, _world, ( z1 - z0 ) / 2, RAIL_COLOR, intensity, range );
        slot++;
    }
    for ( let i = slot; i < EMITTER_SLOTS; i++ ) parkEmitter( uniforms, i );
    uniforms.uEmitterCount.value = slot;
}

export function clearRailEmitters( uniforms: EmitterUniforms ): void {
    for ( let i = 0; i < EMITTER_SLOTS; i++ ) parkEmitter( uniforms, i );
    uniforms.uEmitterCount.value = 0;
}
