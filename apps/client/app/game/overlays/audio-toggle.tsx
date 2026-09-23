import { useSyncExternalStore } from 'react';
import { isMuted, subscribeMuted, toggleMute } from '../../audio/audio-engine';

const ON = '🔊';
const OFF = '🔇';

export function AudioToggle() {
    const muted = useSyncExternalStore( subscribeMuted, isMuted, () => false );

    return (
        <button
            type="button"
            onClick={ () => toggleMute() }
            aria-pressed={ muted }
            aria-label={ muted ? 'Unmute audio' : 'Mute audio' }
            title={ muted ? 'Unmute (M)' : 'Mute (M)' }
            className={ `pointer-events-auto cursor-pointer rounded-[5px] border bg-void/72 px-2.5 py-1.5 text-[16px] leading-none backdrop-blur-[3px] ${
                muted ? 'border-magenta/60 opacity-70' : 'border-cyan/55 shadow-hud'
            }` }
        >
            { muted ? OFF : ON }
        </button>
    );
}
