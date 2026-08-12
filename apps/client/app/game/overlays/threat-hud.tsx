import type { Room } from '@colyseus/sdk';
import { addEffect } from '@react-three/fiber';
import type { RunState } from '@slur/shared';
import { Fragment, useEffect, useRef } from 'react';

// How far BEHIND the local ship a hostile bolt registers as a threat (units). Bolts fly +z at BOLT_SPEED (120)
// — faster than any ship — so only bolts to your REAR are closing; ahead ones outrun you. ~70u ≈ a ~0.7s warning.
// Exported so the test derives its boundary from the constant instead of pinning the literal (a feel retune
// shouldn't redden a test).
export const THREAT_Z = 70;
// Lateral window (units): a bolt within this of your x shares your lane closely enough to matter.
const THREAT_X = 6;
// |dx| under this reads as "dead astern" (no side arrow); beyond it we point to the side the bolt is on.
const CENTER_X = 2.5;
// Peak opacity of the edge vignette (kept LOW — a peripheral "danger" read, never a track-occluding wash). The
// gradient only paints the outer ring, so the visible alpha is this × the gradient stops, well under this.
// Exported so the "stays subtle" test asserts against this cap, not a hardcoded bound a cap bump would redden.
export const VIGNETTE_MAX = 0.42;
// Distance over which the vignette ramps from 0 to the cap. SEPARATE from THREAT_Z so the ramp length and the
// detection range are independently tunable — defaults to THREAT_Z, so behaviour is identical until someone
// deliberately changes it at the #11 feel-gate (e.g. a shorter ramp = a late close-range panic flash).
export const VIGNETTE_RAMP_Z = THREAT_Z;
// Falloff curve exponent. 1 = linear. >1 holds the vignette faint until the bolt is close (a later, sharper
// spike); <1 makes it bloom early. A knob, not a rewrite.
export const VIGNETTE_FALLOFF = 1;

// Directional threat TICK from the nearest hostile rear bolt. world +x renders screen-LEFT (see keyboard.ts),
// so a bolt at dx>0 sits on your screen-left → point ◀ there. Deliberately minimal — the vignette is the primary
// cue now (issue #38); this survives only as a small directional hint the radial glow can't convey. null = clear.
export function threatTick( dx: number | null ): string | null {
    if ( dx === null ) return null;
    if ( dx > CENTER_X ) return '◀ ⚠'; // bolt on your screen-left
    if ( dx < -CENTER_X ) return '⚠ ▶'; // bolt on your screen-right
    return '⚠'; // dead astern
}

// Proximity → vignette opacity. bestDz is the closest hostile rear bolt's distance behind you: smaller (closer
// / just-overtaken) → nearer the cap, VIGNETTE_RAMP_Z away → 0. POSITIVE_INFINITY (no threat) → 0.
export function vignetteOpacity( bestDz: number ): number {
    if ( ! Number.isFinite( bestDz ) ) return 0;
    const clamped = Math.min( Math.max( bestDz, 0 ), VIGNETTE_RAMP_Z );
    return ( 1 - clamped / VIGNETTE_RAMP_Z ) ** VIGNETTE_FALLOFF * VIGNETTE_MAX;
}

// Awareness HUD (Ideate pick over the rearview mirror). A full-screen red edge-vignette whose opacity scales
// with the nearest closing bolt (the primary "danger" read), plus a small directional tick.
//
// PER-FRAME MECHANISM — R3F `addEffect` (non-negotiable #14; candidates weighed in the PR body). It is a GLOBAL
// per-frame callback that runs on R3F's EXISTING render loop but OUTSIDE the Canvas, which is exactly this
// component's shape: DOM chrome, not scene content. So there is no second clock (the previous `setInterval` was
// the client's third), no coupling to NetLoop, and no cross-Canvas seam. CONTRIBUTING §5 names it for this case.
//
// OPACITY HAS ONE OWNER. The frame callback writes ONLY the `--threat` custom property; the
// `opacity-[var(--threat,0)]` utility is the single declaration of the property. Previously an inline
// `opacity: 0` and an imperative `style.opacity` both targeted it, which only worked because every other style
// value was a compile-time constant. Publishing a variable that a class consumes removes that hazard by
// construction. The `,0` fallback matters: before the first frame the property is unset, and an unset var makes
// the whole `opacity` declaration invalid at computed-value time — which resolves to the INITIAL value, 1.
// Without the fallback the vignette would paint full red for one frame on mount.
//
// No CSS transition: at frame rate the value is already continuous. The old 120ms transition existed to smooth
// 100ms polling steps, and since it was LONGER than the poll it also guaranteed the vignette never reached its
// target — it lagged worst exactly when a bolt was closing.
export function ThreatHud( { room }: { room: Room< RunState > } ) {
    const tickRef = useRef< HTMLDivElement >( null );
    const vignetteRef = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — it does nothing but BRACKET the frame subscription to this component's mount, which is
    // the one job Effects are for (subscribe/unsubscribe to an external system). All the work happens in the
    // frame callback, imperatively, into DOM refs. NO setState → this never re-renders React.
    useEffect( () => {
        return addEffect( () => {
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
            // KNOWN SEAM (feel-gate): the tick is binary — it snaps to full the moment a bolt qualifies, while
            // the vignette ramps from ~0 at the same instant. Left as-is deliberately rather than silently
            // smoothed; whether the tick should fade in with the vignette is a #11 judgement, not a refactor.
            const tick = threatTick( nearest );
            tickEl.textContent = tick ?? '';
            tickEl.style.setProperty( '--tick', tick ? '1' : '0' );
            vignetteEl.style.setProperty( '--threat', String( vignetteOpacity( bestDz ) ) );
        } );
    }, [ room ] );

    return (
        <Fragment>
            { /* z-19 sits BELOW the HudPanel base (z-20) so the wash never tints the timer or standings — they
                 are edge-anchored, i.e. exactly where this gradient is strongest. */ }
            <div
                ref={ vignetteRef }
                className="threat-vignette pointer-events-none fixed inset-0 z-19 opacity-[var(--threat,0)]"
            />
            <div
                ref={ tickRef }
                className="pointer-events-none fixed top-16 left-1/2 z-21 -translate-x-1/2 whitespace-pre font-mono text-[16px] font-bold leading-none tracking-[3px] text-threat opacity-[var(--tick,0)] text-shadow-threat"
            />
        </Fragment>
    );
}
