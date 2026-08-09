import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useEffect, useRef } from 'react';

// How far BEHIND the local ship a hostile bolt registers as a threat (units). Bolts fly +z at BOLT_SPEED (120)
// — faster than any ship — so only bolts to your REAR are closing; ahead ones outrun you. ~70u ≈ a ~0.7s warning.
const THREAT_Z = 70;
// Lateral window (units): a bolt within this of your x shares your lane closely enough to matter.
const THREAT_X = 6;
// |dx| under this reads as "dead astern" (no side arrow); beyond it we point to the side the bolt is on.
const CENTER_X = 2.5;
// Poll cadence (ms): fast enough to be useful against a 120u/s bolt, cheap (reads room.state, no React state).
const POLL_MS = 100;

// Directional threat string from the nearest hostile rear bolt. world +x renders screen-LEFT (see keyboard.ts),
// so a bolt at dx>0 sits on your screen-left → point ◀ there. null = no threat.
function threatText( dx: number | null ): string | null {
    if ( dx === null ) return null;
    if ( dx > CENTER_X ) return '◀ ⚠ INCOMING'; // ◀ ⚠
    if ( dx < -CENTER_X ) return '⚠ INCOMING ▶'; // ⚠ ▶
    return '⚠ INCOMING'; // dead astern
}

// Awareness HUD (Ideate pick over the rearview mirror). Imperatively writes a directional ⚠ into a DOM ref when
// a HOSTILE (not-owned) bolt is closing from the rear in roughly your lane. Reads room.state on a timer (NOT
// during render — schema isn't React-reactive) and pushes straight to the ref: zero React re-render, zero state.
export function ThreatHud( { room }: { room: Room< RunState > } ) {
    const ref = useRef< HTMLDivElement >( null );

    // JUSTIFIED EFFECT — syncs with an external system (Colyseus room.state) on a timer, writing IMPERATIVELY
    // into a DOM ref (textContent/visibility). NO setState → it never re-renders React.
    //  1) render-derivation? no — room.state mutates over the wire and fires no re-render.
    //  2) event handler? no discrete event — a periodic sample of live external state.
    //  3) loader/action data? no — live per-frame telemetry, not navigation data.
    //  4) ref/module singleton? YES for the WRITE — straight into a DOM ref; the effect only brackets the
    //     timer to the HUD's mount. 5) external sync? YES — a timer polling the room. VERDICT: keep.
    useEffect( () => {
        const id = setInterval( () => {
            const el = ref.current;
            if ( ! el ) return;
            const self = room.state.players.get( room.sessionId );
            let nearest: number | null = null; // dx of the closest qualifying bolt
            if ( self && ! self.spectating && ! self.dead ) {
                let bestDz = Number.POSITIVE_INFINITY;
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
            const text = threatText( nearest );
            el.textContent = text ?? '';
            el.style.opacity = text ? '1' : '0';
        }, POLL_MS );
        return () => clearInterval( id );
    }, [ room ] );

    return (
        <div
            ref={ ref }
            style={ {
                position: 'fixed',
                top: 64,
                left: '50%',
                transform: 'translateX( -50% )',
                zIndex: 21,
                pointerEvents: 'none',
                opacity: 0,
                transition: 'opacity 80ms linear',
                font: '700 18px / 1 ui-monospace, monospace',
                letterSpacing: '3px',
                color: '#ff5c6e',
                textShadow: '0 0 12px rgba( 255, 92, 110, 0.85 )',
                whiteSpace: 'pre',
            } }
        />
    );
}
