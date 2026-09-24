import { useSyncExternalStore } from 'react';
import { isMuted, subscribeMuted, toggleMute } from '../../audio/audio-engine';
import { GHOST, keepFocusOff } from '../../ui/ghost';
import { SpeakerGlyph } from '../../ui/speaker-glyph';

export function AudioToggle() {
    const muted = useSyncExternalStore( subscribeMuted, isMuted, () => false );

    return (
        <button
            type="button"
            onMouseDown={ keepFocusOff }
            onClick={ () => toggleMute() }
            aria-pressed={ muted }
            aria-label={ muted ? 'Unmute audio' : 'Mute audio' }
            title={ muted ? 'Unmute (M)' : 'Mute (M)' }
            className={ `${ GHOST } flex w-9 items-center justify-center` }
        >
            <SpeakerGlyph muted={ muted } />
        </button>
    );
}
