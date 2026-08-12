import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { Fragment, useEffect, useRef } from 'react';

// How far BEHIND the local ship a hostile bolt registers as a threat (units). Bolts fly +z at BOLT_SPEED (120)
// — faster than any ship — so only bolts to your REAR are closing; ahead ones outrun you. ~70u ≈ a ~0.7s warning.
const THREAT_Z = 70;
// Lateral window (units): a bolt within this of your x shares your lane closely enough to matter.
const THREAT_X = 6;
// |dx| under this reads as "dead astern" (no side arrow); beyond it we point to the side the bolt is on.
const CENTER_X = 2.5;
// Poll cadence (ms): fast enough to be useful against a 120u/s bolt, cheap (reads room.state, no React state).
const POLL_MS = 100;
// Peak opacity of the edge vignette (kept LOW — a peripheral "danger" read, never a track-occluding wash). The
// gradient itself only paints the outer ring, so the visible alpha is this × the gradient stops, well under this.
const VIGNETTE_MAX = 0.42;

// Directional threat TICK from the nearest hostile rear bolt. world +x renders screen-LEFT (see keyboard.ts),
// so a bolt at dx>0 sits on your screen-left → point ◀ there. Deliberately minimal — the vignette is the primary
// cue now (issue #38); this survives only as a small directional hint the radial glow can't convey. null = clear.
export function threatTick( dx: number | null ): string | null {
    if ( dx === null ) return null;
    if ( dx > CENTER_X ) return '◀ ⚠'; // bolt on your screen-left
    if ( dx < -CENTER_X ) return '⚠ ▶'; // bolt on your screen-right
    return '⚠'; // dead astern
}

// Proximity → vignette opacity. bestDz is the closest hostile rear bolt's distance behind you, in (-2, THREAT_Z):
// smaller (closer / just-overtaken) → nearer the cap, THREAT_Z away → 0. POSITIVE_INFINITY (no threat) → 0.
export function vignetteOpacity( bestDz: number ): number {
    if ( ! Number.isFinite( bestDz ) ) return 0;
    const clamped = Math.min( Math.max( bestDz, 0 ), THREAT_Z );
    return ( 1 - clamped / THREAT_Z ) * VIGNETTE_MAX;
}

// Awareness HUD (Ideate pick over the rearview mirror). Imperatively drives two DOM refs when a HOSTILE
// (not-owned) bolt is closing from the rear in roughly your lane: a full-screen red edge-vignette whose opacity
// scales with proximity (the primary "danger" read), plus a small directional tick. Reads room.state on a timer
// (NOT during render — schema isn't React-reactive) and pushes straight to the refs: zero React re-render, zero
// state. One timer feeds both — the vignette and the tick share the SAME nearest-bolt scan (issue #38).
export function ThreatHud( { room }: { room: Room< RunState > } ) {
    const tickRef = useRef< HTMLDivElement >( null );
    const vignetteRef = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — syncs with an external system (Colyseus room.state) on a timer, writing IMPERATIVELY
    // into DOM refs (textContent / style.opacity). NO setState → it never re-renders React.
    //  1) render-derivation? no — room.state mutates over the wire and fires no re-render.
    //  2) event handler? no discrete event — a periodic sample of live external state.
    //  3) loader/action data? no — live per-frame telemetry, not navigation data.
    //  4) ref/module singleton? YES for the WRITE — straight into DOM refs; the effect only brackets the
    //     timer to the HUD's mount. 5) external sync? YES — a timer polling the room. VERDICT: keep.
    useEffect( () => {
        const id = setInterval( () => {
            const tickEl = tickRef.current;
            const vignetteEl = vignetteRef.current;
            if ( ! tickEl || ! vignetteEl ) return;
            const self = room.state.players.get( room.sessionId );
            let nearest: number | null = null; // dx of the closest qualifying bolt (for the directional tick)
            let bestDz = Number.POSITIVE_INFINITY; // its distance behind you (for vignette intensity)
            if ( self && ! self.spectating && ! self.dead ) {
                room.state.projectiles.forEach( ( b ) => {
                    if ( b.ownerId === room.sessionId ) return; // your own bolt never threatens you
                    const dz = self.z - b.z; // >0 = bolt behind (closing); allow a hair past for the just-overtaken case
                    const dx = b.x - self.x;
                    if ( dz > -2 && dz < THREAT_Z && Math.abs( dx ) < THREAT_X && dz < bestDz ) {
                        bestDz = dz;
                        nearest = dx;
                    }
                } );
            }
            const tick = threatTick( nearest );
            tickEl.textContent = tick ?? '';
            tickEl.style.opacity = tick ? '1' : '0';
            vignetteEl.style.opacity = String( vignetteOpacity( bestDz ) );
        }, POLL_MS );
        return () => clearInterval( id );
    }, [ room ] );

    return (
        <Fragment>
            <div
                ref={ vignetteRef }
                style={ {
                    position: 'fixed',
                    inset: 0,
                    zIndex: 20, // below the tick (21); a peripheral wash, never over the standings/timer
                    pointerEvents: 'none',
                    opacity: 0,
                    // Smooths the 100ms polling steps and fades cleanly to 0 the tick a threat clears.
                    transition: 'opacity 120ms linear',
                    // Transparent centre → red only at the edges: the track stays fully readable through the middle.
                    background:
                        'radial-gradient( ellipse at center, rgba( 255, 40, 60, 0 ) 40%, rgba( 232, 28, 48, 0.9 ) 115% )',
                } }
            />
            <div
                ref={ tickRef }
                style={ {
                    position: 'fixed',
                    top: 64,
                    left: '50%',
                    transform: 'translateX( -50% )',
                    zIndex: 21,
                    pointerEvents: 'none',
                    opacity: 0,
                    transition: 'opacity 80ms linear',
                    font: '700 16px / 1 ui-monospace, monospace',
                    letterSpacing: '3px',
                    color: '#ff5c6e',
                    textShadow: '0 0 12px rgba( 255, 92, 110, 0.85 )',
                    whiteSpace: 'pre',
                } }
            />
        </Fragment>
    );
}
