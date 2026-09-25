import { DEFAULT_SIM_CONFIG, simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import type { Predictor } from '../../net/prediction';
import { blockWorld } from '../block-state';
import { currentInput } from '../input/current-input';
import { localRole } from '../spectator';
import { bankTuning, driveAttitude } from './attitude';
import { sparkIfBounced } from './bounce-spark';
import { Attitude, Interp, LocalPlayer, Net, Prev, Remote, Render, Sim } from './traits';

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
        const tuning = tuningForShip( net.shipId );
        const stunBefore = s.stunTimer;
        const vzBefore = s.vz;
        simulate( s, input, dt, tuning, track, DEFAULT_SIM_CONFIG, blockWorld );
        sparkIfBounced( s, stunBefore, vzBefore, dt, tuning );
    } );
}

const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;

export function remoteInterpSystem( world: World, dt: number ): void {
    const renderTime = performance.now() - RENDER_DELAY_MS;
    const blink = stunBlink();
    const bank = bankTuning();
    world.query( Interp, Render, Net, Attitude, Remote ).readEach( ( [ interp, grp, net, att ] ) => {
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
        let vy: number;
        if ( a && b ) {
            const span = b.t - a.t || 1;
            const t = ( renderTime - a.t ) / span;
            x = lerp( a.x, b.x, t );
            y = lerp( a.y, b.y, t );
            z = lerp( a.z, b.z, t );
            vx = lerp( a.vx, b.vx, t );
            vy = ( ( b.y - a.y ) / span ) * 1000;
        } else {
            const last = buf[ buf.length - 1 ];
            x = last.x;
            y = last.y;
            z = last.z;
            vx = last.vx;
            vy = 0;
        }
        grp.position.set( x, y, z );
        driveAttitude( att, grp, vx, vy, tuningForShip( net.shipId ), bank, dt );
        const latest = buf[ buf.length - 1 ];
        grp.visible = ! latest.dead && latest.stunned ? blink : true;
    } );
}
