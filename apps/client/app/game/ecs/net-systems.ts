import { froundSimShip, simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import type { Predictor } from '../../net/prediction';
import { blockWorld } from '../block-state';
import { currentInput } from '../input/current-input';
import { noteLocalHops } from '../local-hop';
import { localRole } from '../spectator';
import { bankTuning, driveAttitude } from './attitude';
import { sparkIfBounced } from './bounce-spark';
import { runConfig } from './run-config';
import { Attitude, Interp, LocalPlayer, Net, Prev, Remote, Render, Sim, type Snapshot } from './traits';

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
    const config = runConfig( world );
    q.updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        const tuning = tuningForShip( net.shipId );
        const hopsBefore = s.portalHops;
        const contact = simulate( s, input, dt, tuning, track, config, blockWorld );
        froundSimShip( s );
        if ( s.portalHops !== hopsBefore ) {
            noteLocalHops( hopsBefore, s.portalHops, prev, s, blockWorld.portals.values() );
            prev.x = s.x;
            prev.y = s.y;
            prev.z = s.z;
        }
        sparkIfBounced( s, contact, tuning );
    } );
}

const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;

function spanAt( buf: readonly Snapshot[], renderTime: number ): number {
    for ( let i = 0; i < buf.length - 1; i++ ) {
        if ( buf[ i ].t <= renderTime && buf[ i + 1 ].t >= renderTime ) return i;
    }
    return -1;
}

export function remoteInterpSystem( world: World, dt: number ): void {
    const renderTime = performance.now() - RENDER_DELAY_MS;
    const blink = stunBlink();
    const bank = bankTuning();
    world.query( Interp, Render, Net, Attitude, Remote ).readEach( ( [ interp, grp, net, att ] ) => {
        const buf = interp.buffer;
        if ( buf.length === 0 ) return;
        const i = spanAt( buf, renderTime );
        const a = i < 0 ? null : buf[ i ];
        const b = i < 0 ? null : buf[ i + 1 ];
        let x: number;
        let y: number;
        let z: number;
        let vx: number;
        let vy: number;
        if ( a && b && a.hops === b.hops ) {
            const span = b.t - a.t || 1;
            const t = ( renderTime - a.t ) / span;
            x = lerp( a.x, b.x, t );
            y = lerp( a.y, b.y, t );
            z = lerp( a.z, b.z, t );
            vx = lerp( a.vx, b.vx, t );
            vy = ( ( b.y - a.y ) / span ) * 1000;
        } else {
            const held = a ?? buf[ buf.length - 1 ];
            x = held.x;
            y = held.y;
            z = held.z;
            vx = held.vx;
            vy = 0;
        }
        grp.position.set( x, y, z );
        driveAttitude( att, grp, vx, vy, tuningForShip( net.shipId ), bank, dt );
        const latest = buf[ buf.length - 1 ];
        grp.visible = ! latest.dead && latest.stunned ? blink : true;
    } );
}
