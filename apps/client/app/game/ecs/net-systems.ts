import { simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import type { Predictor } from '../../net/prediction';
import { currentInput } from '../input/keyboard';
import { localRole } from '../spectator';
import { Interp, LocalPlayer, Net, Prev, Remote, Render, Sim } from './traits';

export function freezeLocalPrev( world: World ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}

const STUN_BLINK_MS = 90;
function stunBlink(): boolean {
    return Math.floor( performance.now() / STUN_BLINK_MS ) % 2 === 0;
}

export function localDeathVfxSystem( world: World ): void {
    const blink = stunBlink();
    world.query( Sim, Render, LocalPlayer ).readEach( ( [ s, grp ] ) => {
        if ( localRole.spectating ) {
            grp.visible = false;
            return;
        }
        grp.visible = ! s.dead && s.stunTimer > 0 ? blink : true;
    } );
}

export const RENDER_DELAY_MS = 100;

export function netFlightSystem( world: World, dt: number, predictor: Predictor, track: Track ): void {
    const q = world.query( Sim, Prev, Net, LocalPlayer );
    if ( q.length === 0 ) return;
    const input = { ...currentInput() };
    predictor.record( input );
    q.updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        simulate( s, input, dt, tuningForShip( net.shipId ), track );
    } );
}

const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;

export function remoteInterpSystem( world: World ): void {
    const renderTime = performance.now() - RENDER_DELAY_MS;
    const blink = stunBlink();
    world.query( Interp, Render, Net, Remote ).readEach( ( [ interp, grp, net ] ) => {
        const buf = interp.buffer;
        if ( buf.length === 0 ) return;
        let a: ( typeof buf )[ number ] | null = null;
        let b: ( typeof buf )[ number ] | null = null;
        for ( let i = 0; i < buf.length - 1; i++ ) {
            if ( buf[ i ].t <= renderTime && buf[ i + 1 ].t >= renderTime ) {
                a = buf[ i ];
                b = buf[ i + 1 ];
                break;
            }
        }
        let x: number;
        let y: number;
        let z: number;
        let vx: number;
        if ( a && b ) {
            const t = ( renderTime - a.t ) / ( b.t - a.t || 1 );
            x = lerp( a.x, b.x, t );
            y = lerp( a.y, b.y, t );
            z = lerp( a.z, b.z, t );
            vx = lerp( a.vx, b.vx, t );
        } else {
            const last = buf[ buf.length - 1 ];
            x = last.x;
            y = last.y;
            z = last.z;
            vx = last.vx;
        }
        grp.position.set( x, y, z );
        grp.rotation.z = -( vx / tuningForShip( net.shipId ).strafeClamp ) * 0.5;
        const latest = buf[ buf.length - 1 ];
        grp.visible = ! latest.dead && latest.stunned ? blink : true;
    } );
}
