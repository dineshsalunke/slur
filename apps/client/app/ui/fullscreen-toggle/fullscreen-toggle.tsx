import { useSyncExternalStore } from 'react';
import { canFullscreen, isFullscreen, subscribeFullscreen, toggleFullscreen } from '../fullscreen';
import { FullscreenGlyph } from '../fullscreen-glyph';
import { GHOST, keepFocusOff } from '../ghost';

export function FullscreenToggle() {
    const on = useSyncExternalStore( subscribeFullscreen, isFullscreen, () => false );
    if ( ! canFullscreen() ) return null;

    return (
        <button
            type="button"
            onMouseDown={ keepFocusOff }
            onClick={ () => void toggleFullscreen() }
            aria-pressed={ on }
            aria-label={ on ? 'Exit fullscreen' : 'Fullscreen' }
            title={ on ? 'Exit fullscreen' : 'Fullscreen' }
            className={ `${ GHOST } flex w-9 items-center justify-center` }
        >
            <FullscreenGlyph on={ on } />
        </button>
    );
}
