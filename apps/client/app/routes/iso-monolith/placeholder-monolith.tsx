import { Fragment } from 'react';
import { BOUNDARY_SURFACE } from '../../game/scene/track-materials';

const OBELISK = { w: 26, h: 300, d: 26 };
const SLAB = { w: 60, h: 140, d: 14 };

export function PlaceholderMonolith() {
    return (
        <Fragment>
            <mesh position={ [ 0, OBELISK.h / 2, 0 ] }>
                <boxGeometry args={ [ OBELISK.w, OBELISK.h, OBELISK.d ] } />
                <meshStandardMaterial { ...BOUNDARY_SURFACE } />
            </mesh>

            <mesh position={ [ 90, SLAB.h / 2, -40 ] }>
                <boxGeometry args={ [ SLAB.w, SLAB.h, SLAB.d ] } />
                <meshStandardMaterial { ...BOUNDARY_SURFACE } />
            </mesh>
        </Fragment>
    );
}
