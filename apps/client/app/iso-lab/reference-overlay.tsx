import { Fragment, useState } from 'react';
import { boardUrl } from './reference-boards';

export type OverlayMode = 'off' | 'blend' | 'split' | 'wipe';

export function ReferenceOverlay( { mode, boardId, t }: { mode: OverlayMode; boardId: string; t: number } ) {
    const [ failed, setFailed ] = useState( false );

    if ( mode === 'off' ) return <Fragment />;

    if ( failed ) {
        return (
            <div className="pointer-events-none absolute inset-x-0 top-0 z-20 bg-red-950/80 p-3 text-center text-xs text-red-200">
                Reference board <code>{ boardId }</code> failed to load. The boards are served by a DEV-ONLY Vite
                middleware (<code>art-refs-plugin.ts</code>) — the overlay does not work in a production build. In dev,
                this usually means an unsmudged git-lfs asset: run <code>git lfs pull</code>.
            </div>
        );
    }

    const style =
        mode === 'split'
            ? { top: 0, bottom: 0, left: `${ t * 100 }%`, right: 0 }
            : {
                  inset: 0,
                  opacity: mode === 'blend' ? t : 1,
                  clipPath: mode === 'wipe' ? `inset(0 ${ ( 1 - t ) * 100 }% 0 0)` : undefined,
              };

    return (
        <Fragment>
            <div
                className={ `pointer-events-none absolute z-10 ${ mode === 'split' ? 'bg-black' : '' }` }
                style={ style }
            >
                <img
                    src={ boardUrl( boardId ) }
                    alt={ `concept board ${ boardId }` }
                    className="h-full w-full object-contain"
                    onError={ () => setFailed( true ) }
                />
            </div>

            { mode === 'wipe' ? (
                <div
                    className="pointer-events-none absolute inset-y-0 z-20 w-px bg-[#F59A24]"
                    style={ { left: `${ t * 100 }%` } }
                />
            ) : (
                <Fragment />
            ) }
        </Fragment>
    );
}
