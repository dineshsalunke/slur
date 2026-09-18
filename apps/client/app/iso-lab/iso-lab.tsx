import { type ReactNode, useState } from 'react';
import { IsoLabCanvas } from './iso-lab-canvas';
import { IsoLabControls } from './iso-lab-controls';
import { type OverlayMode, ReferenceOverlay } from './reference-overlay';

export interface IsoLabProps {
    /** Panel heading — the ingredient under review. */
    title: string;
    /** The subject's largest world dimension, in units. Frames the camera and sizes the ruler. */
    size: number;
    /** Board filename from `REFERENCE_BOARDS` to open with. */
    board: string;
    /** The subject itself: R3F nodes, at TRUE world scale. Never scaled by the lab. */
    children: ReactNode;
}

/**
 * The reusable isolation lab. ONE ingredient, the game's real void/bloom/materials, a concept board to
 * compare it against.
 *
 * ── HOW TO ADD AN INGREDIENT ROUTE (the whole contract — two steps, no shared files beyond one line) ──
 *   1. Create `app/routes/iso-<thing>/route.tsx`:
 *        export default function IsoThingRoute() {
 *            return <IsoLab title="Thing" size={300} board="04_asteroids_final.png"><Thing /></IsoLab>;
 *        }
 *   2. Add ONE line to `app/routes.ts`:
 *        route( 'iso-thing', 'routes/iso-thing/route.tsx' ),
 * Nothing in `app/iso-lab/` needs to change. Two lanes can do this simultaneously and touch only their own
 * directory plus one adjacent line — which is the constraint this design was built around.
 *
 * WHY NOT `<Canvas>` PER ROUTE: every ingredient must be judged under the SAME bloom and the SAME void, or
 * two lanes will unknowingly tune against different renderers and their outputs will not compose. The wrapper
 * owning the Canvas is the mechanism that makes that impossible rather than merely discouraged.
 *
 * WHY `useState` AND NOT A MODULE SINGLETON (`/art-lab` and `/art-gallery` both use singletons): those hold
 * values read PER FRAME inside `useFrame`, where a re-render would be catastrophic. Nothing here is read per
 * frame — the overlay is DOM, and the Canvas is memoised so the slider never reaches it. State that only ever
 * changes on a click belongs in React; reaching for a singleton anyway would be cargo-culting the pattern
 * past the reason it exists.
 */
export function IsoLab( { title, size, board, children }: IsoLabProps ) {
    const [ mode, setMode ] = useState< OverlayMode >( 'off' );
    const [ boardId, setBoardId ] = useState( board );
    const [ t, setT ] = useState( 0.5 );
    const [ bloom, setBloom ] = useState( true );
    const [ grid, setGrid ] = useState( true );

    // In `split` the render gets its own pane, so the Canvas is inset from the right by (1 - t). Everything
    // else is full-bleed with the board stacked on top.
    const renderPane = mode === 'split' ? { right: `${ ( 1 - t ) * 100 }%` } : { right: 0 };

    return (
        <main className="fixed inset-0 overflow-hidden bg-black">
            <div className="absolute inset-y-0 left-0" style={ renderPane }>
                <IsoLabCanvas size={ size } bloom={ bloom } grid={ grid }>
                    { children }
                </IsoLabCanvas>
            </div>

            { /* `key` on the board id so a failed load resets when a different board is picked — otherwise
                 one 404 would poison the overlay for the rest of the session. */ }
            <ReferenceOverlay key={ boardId } mode={ mode } boardId={ boardId } t={ t } />

            <IsoLabControls
                title={ title }
                size={ size }
                mode={ mode }
                onMode={ setMode }
                boardId={ boardId }
                onBoard={ setBoardId }
                t={ t }
                onT={ setT }
                bloom={ bloom }
                onBloom={ setBloom }
                grid={ grid }
                onGrid={ setGrid }
            />
        </main>
    );
}
