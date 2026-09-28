import { useState } from 'react';
import { GHOST, keepFocusOff } from '../ghost';
import { dismissHomeScreenHint } from './home-screen-hint.utils';

export function HomeScreenHint( { due }: { due: boolean } ) {
    const [ open, setOpen ] = useState( due );
    if ( ! open ) return null;

    return (
        <aside
            aria-label="Fullscreen on iPhone"
            className="flex max-w-[34ch] items-start gap-3 border border-readout/25 bg-deep/80 px-3 py-2 text-[13px] leading-[1.4] text-readout"
        >
            <p className="m-0">
                For fullscreen, tap <span className="font-semibold">Share</span>, then{ ' ' }
                <span className="font-semibold">Add to Home Screen</span>, and open SLUR from there.
            </p>
            <button
                type="button"
                onMouseDown={ keepFocusOff }
                onClick={ () => {
                    dismissHomeScreenHint();
                    setOpen( false );
                } }
                className={ `${ GHOST } shrink-0 px-3` }
            >
                OK
            </button>
        </aside>
    );
}
