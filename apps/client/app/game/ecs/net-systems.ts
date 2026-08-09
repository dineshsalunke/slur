import { simulate, type Track, tuningForShip } from '@slur/shared';
import type { World } from 'koota';
import type { Predictor } from '../../net/prediction';
import { currentInput } from '../input/keyboard';
import { localRole } from '../spectator';
import { Interp, LocalPlayer, Net, Prev, Remote, Render, Sim } from './traits';

// Freeze the local ship's interpolation when the sim ISN'T stepping (lobby/countdown/finished/spectating):
// copy Sim→Prev so syncRenderSystem's prev→sim lerp becomes the identity and the ship sits still at its
// authoritative pose. Without this, netFlightSystem (the only Prev writer) doesn't run, so a STALE Prev gets
// lerped toward Sim by the oscillating fixed-step alpha → violent per-frame jitter (and the lobby hero-cam
// that looks at the ship flickers). Cheap: the single local entity.
export function freezeLocalPrev( world: World ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}

// Rapid visible-blink while stunned — makes a hit UNMISTAKABLE ("that ship got hit"). Time-based so it needs
// no per-entity state and no allocation; local + remote systems share the phase so all stunned ships flicker
// in sync. ~90ms half-period = a fast, disruptive strobe over the brief stun.
const STUN_BLINK_MS = 90;
function stunBlink(): boolean {
    return Math.floor( performance.now() / STUN_BLINK_MS ) % 2 === 0;
}

// Death + stun VFX (minimal for the core loop): hide the local ship while derezzed OR spectating (a mid-race
// joiner owns a frozen local ship it must not see); while stunned (predicted Sim.stunTimer>0) strobe its
// visibility so a hit reads on your OWN ship too. Full TRON derezz is S6. Imperative, no React state.
export function localDeathVfxSystem( world: World ): void {
    const blink = stunBlink();
    world.query( Sim, Render, LocalPlayer ).readEach( ( [ s, grp ] ) => {
        const shown = ! s.dead && ! localRole.spectating;
        grp.visible = shown && ( s.stunTimer > 0 ? blink : true );
    } );
}

// Render remote ships this far in the past so we always have a "next" snapshot to interpolate toward
// (netcode: ≥1 patch interval; patchRate is 50ms, so 100ms = 2 patches of slack for jitter/loss).
// Exported so the projectile field interpolates on the SAME clock as remote ships (shared render delay).
export const RENDER_DELAY_MS = 100;

// Local predicted flight tick (fixed step). Same as S1's flightSystem but it RECORDS each input into
// the predictor (value-copied, since keyboard.ts reuses one object) so reconciliation can replay it.
export function netFlightSystem( world: World, dt: number, predictor: Predictor, track: Track ): void {
    const q = world.query( Sim, Prev, Net, LocalPlayer );
    if ( q.length === 0 ) return; // local ship not spawned yet (waiting on players.onAdd)
    const input = { ...currentInput() }; // value copy — the pending list must not alias the reused object
    predictor.record( input );
    q.updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        // Predict with THIS ship's tuning + the SAME track the server authorities → identical replay math.
        simulate( s, input, dt, tuningForShip( net.shipId ), track );
    } );
}

const lerp = ( a: number, b: number, t: number ) => a + ( b - a ) * t;

// Remote interpolation: ease each remote ship toward where it was RENDER_DELAY_MS ago, between the
// two buffered snapshots that straddle that time. Never extrapolates — on <2 usable samples it holds
// at the latest known pose (the classic new-joiner warm-up, handled explicitly).
export function remoteInterpSystem( world: World ): void {
    const renderTime = performance.now() - RENDER_DELAY_MS;
    const blink = stunBlink(); // shared strobe phase (same as the local ship) for stunned remotes
    // Trait ORDER matters: koota fills the value array positionally for every trait, tags included.
    // Put the tag (Remote) LAST so [ interp, grp ] align to Interp + Render (not Remote + Interp).
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
            const last = buf[ buf.length - 1 ]; // hold latest (renderTime beyond buffer, or <2 samples)
            x = last.x;
            y = last.y;
            z = last.z;
            vx = last.vx;
        }
        grp.position.set( x, y, z );
        grp.rotation.z = -( vx / tuningForShip( net.shipId ).strafeClamp ) * 0.5; // cosmetic bank (per-ship clamp)
        const latest = buf[ buf.length - 1 ]; // latest server truth for dead/stunned
        grp.visible = ! latest.dead && ( latest.stunned ? blink : true ); // hide a derezzed remote; strobe a stunned one
    } );
}
