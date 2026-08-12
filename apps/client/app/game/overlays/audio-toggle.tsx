import { useSyncExternalStore } from 'react';
import { isMuted, subscribeMuted, toggleMute } from '../../audio/audio-engine';

// Speaker glyphs: the base cone plus either sound waves or a cross. Kept as text rather than an SVG or an
// icon dep — the HUD is already a monospace/glyph aesthetic (see the ⚠ threat tick and ▶ GO button).
const ON = '🔊';
const OFF = '🔇';

// Visible audio on/off toggle (issue #63). Audio was keyboard-only (`M`), so a mouse-only player could
// neither discover nor use it.
//
// SUBSCRIPTION LIVES AT THIS LEAF (non-negotiable #10). `useSyncExternalStore` binds directly to the audio
// engine's module singleton, so a mute change re-renders ONLY this button — never a parent, never a sibling,
// and never the Canvas. Lifting mute into a parent and prop-drilling it would re-render the whole overlay
// tree for a one-glyph change.
//
// TWO-WAY SYNC IS FREE, not implemented here. `subscribeMuted` fires inside `setMuted`, which is the single
// write path: this button calls `toggleMute()` → `setMuted()`, and the `M` key calls `setMuted()` directly
// (game-audio.tsx). So neither route needs to know about the other. There is no mute logic in this file.
export function AudioToggle() {
    const muted = useSyncExternalStore(
        subscribeMuted,
        isMuted,
        // Server snapshot: the SPA shell is prerendered with no `localStorage`, where the engine reports
        // unmuted. Matching that explicitly avoids a hydration mismatch on a persisted-muted reload.
        () => false,
    );

    return (
        <button
            type="button"
            onClick={ () => toggleMute() }
            aria-pressed={ muted }
            aria-label={ muted ? 'Unmute audio' : 'Mute audio' }
            title={ muted ? 'Unmute (M)' : 'Mute (M)' }
            className={ `pointer-events-auto fixed bottom-4 left-4 z-20 cursor-pointer rounded-[5px] border bg-void/72 px-2.5 py-1.5 text-[16px] leading-none backdrop-blur-[3px] ${
                muted ? 'border-magenta/60 opacity-70' : 'border-cyan/55 shadow-hud'
            }` }
        >
            { muted ? OFF : ON }
        </button>
    );
}
