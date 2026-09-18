import { Fragment, useState } from 'react';
import { boardUrl } from './reference-boards';

/**
 * How the concept board is shown against the render.
 * - `off`    — no board loaded at all (no 2 MB fetch)
 * - `blend`  — board over the render, `t` = its opacity. Best for "is the silhouette the same shape"
 * - `split`  — side by side, `t` = the render pane's width fraction. Best for "is the mood the same"
 * - `wipe`   — board clipped to the left `t` of the frame, over the render. Best for "does the edge line up"
 */
export type OverlayMode = 'off' | 'blend' | 'split' | 'wipe';

/**
 * The concept board, laid over or beside the render.
 *
 * ONE scalar `t` drives all three modes — opacity in blend, split fraction in split, wipe fraction in wipe.
 * That is a deliberate compression: three sliders would be three things to find, and the modes are never
 * used simultaneously. Dragging the same slider while cycling modes is how you actually review.
 *
 * `object-contain` is non-negotiable here: `cover` would crop the board, and a cropped reference silently
 * changes the apparent proportions of the thing you are trying to match.
 *
 * SUBSCRIPTION BOUNDARY: the load-failure flag lives HERE, not in `IsoLab`. A 404 (built SPA, or an
 * unsmudged lfs pointer) re-renders this leaf and nothing else — notably not the Canvas.
 */
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

    // `split` is the only mode where the board is NOT an overlay — it owns its own pane, so the render is
    // never occluded and both can be looked at at full brightness. Everything else stacks.
    const style =
        mode === 'split'
            ? // top/bottom are explicit: an absolutely-positioned box given only left/right collapses to
              // its content height, which parked the board at the top of the pane with dead space below.
              { top: 0, bottom: 0, left: `${ t * 100 }%`, right: 0 }
            : {
                  inset: 0,
                  opacity: mode === 'blend' ? t : 1,
                  clipPath: mode === 'wipe' ? `inset(0 ${ ( 1 - t ) * 100 }% 0 0)` : undefined,
              };

    return (
        <Fragment>
            { /* An opaque backdrop ONLY in split, where the board owns its own pane. In blend it would be
                 fatal: the div's opacity applies to the backdrop too, so a 50% blend would be crossfading
                 the render against BLACK rather than against the board — quietly darkening exactly the
                 thing being judged. In wipe the letterbox bars staying transparent lets the render show
                 through them, which reads better than a black frame. */ }
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

            { /* The wipe seam is a SIBLING, not a child: as a child it sat exactly on its own container's
                 clip edge and was clipped out of existence — an invisible divider on the one mode that
                 needs one most. Marigold so it reads as instrument chrome, not world. */ }
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
