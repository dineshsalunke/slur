import { Fragment } from 'react';
import { DeepSpaceSky } from '../../game/scene/deep-space-sky';
import { DEEP_SPACE } from '../../game/scene/sky-config';
import { IsoLab } from '../../iso-lab/iso-lab';
import { BLOCK_FAMILY } from './block-dimensions';
import { SealedBlockFamily } from './sealed-block';

export function meta() {
    return [ { title: 'SLUR — Iso Lab · Blocks' } ];
}

/**
 * Frames the whole row rather than one block. `<IsoLab>` puts the camera at `dist = max( 12, size * 1.9 )`
 * on a 45° fov, so the visible width is about `1.49 * dist` at 16:9; wanting ~40% margin around the row
 * gives `size ≈ span / 2`. Passing the raw span would frame the row at a third of the height and waste the
 * gate. (Note `size` is inert for subjects below ~6.3u, where the `max( 12, … )` floor binds instead.)
 */
const FRAME_SIZE = BLOCK_FAMILY.span / 2;

/**
 * `/iso-block` — the sealed deadly block in isolation. Art-pass task 7.
 *
 * THREE FOOTPRINTS, NOT ONE. "Reads as one material world without looking like a repeated asset" is only
 * judgeable as a set, and width/depth are the generator's output rather than the art's — so the row is a
 * spread of test cases and the real acceptance is that the material holds across the continuous range.
 *
 * `rig={false}` turns OFF the lab's neutral ambient+directional pair and mounts the SHIPPED sky rig in its
 * place. The lab's rig is a lane-local `ambientLight` + `directionalLight` — the same pair task 2's D4
 * deleted from `/art-lab` — and a block tuned under it would look right here and wrong in the game. The
 * neutral rig stays one click away in the panel as a sanity check, never as the gate.
 *
 * Shadow sides going black under a near-black sky with no fill is THE DIRECTION, not a bug to light around
 * (`.claude/art-pass/03-lighting/README.md` §1a). If this block ever needs lane-local fill to look good, the
 * block is wrong, not the lighting. The backdrop measures ~linear 0.01 and lights nothing — the
 * `<Lightformer>` bake in `SkyEnvironment` plus `StarLight` do the work.
 *
 * Board 10 is asset identity; board 12 outranks it on whether the material belongs to the world. Neither is
 * ever a source of dimensions — those come from `docs/ART_SCALE_REFERENCE.md` §2 alone.
 */
export default function IsoBlockRoute() {
    return (
        <IsoLab title="Sealed deadly block" size={ FRAME_SIZE } board="10_obstacle_blocks_final.png" rig={ false }>
            <Fragment>
                <DeepSpaceSky config={ DEEP_SPACE } />
                <SealedBlockFamily />
            </Fragment>
        </IsoLab>
    );
}
