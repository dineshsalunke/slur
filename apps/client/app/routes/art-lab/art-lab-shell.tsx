import { procgenDescriptor, resolveTrack } from '@slur/shared';
import { Fragment, useMemo, useState } from 'react';
import { ENV_VARIANTS } from '../../game/scene/env-config';
import { ArtLabCanvas } from './art-lab-canvas';
import { ArtLabControls } from './art-lab-controls';
import { ArtLabReadout } from './art-lab-readout';
import { DEFAULT_LAB_LAYERS, type LabLayerKey } from './lab-layers';

const ENV_NAMES = ENV_VARIANTS.map( ( v ) => v.name );

/**
 * The lab's structural knobs — seed, environment, bloom, layer visibility — and the three things that
 * consume them. Changing one of these IS a structural change and should re-render the scene.
 *
 * A leaf below the route entry rather than the route entry itself, matching `/env-lab`, whose route is
 * three lines with its state inside the canvas, and `/art-gallery`, whose route holds no hooks at all.
 * That keeps a React Router loader or navigation re-render from reconciling the whole scene subtree.
 * Per-frame knobs (pause, ghost) are not here at all; see `lab-state.ts`.
 */
export function ArtLabShell() {
    const [ seed, setSeed ] = useState( 1234 );
    const [ envIndex, setEnvIndex ] = useState( ENV_VARIANTS.length - 1 ); // default C · Grid Void (the locked one)
    const [ bloom, setBloom ] = useState( true );
    const [ layers, setLayers ] = useState( DEFAULT_LAB_LAYERS );
    // Functional update so the handler never closes over a stale `layers` — the controls leaf holds this
    // callback across re-renders.
    const toggleLayer = ( key: LabLayerKey ) => setLayers( ( prev ) => ( { ...prev, [ key ]: ! prev[ key ] } ) );

    // The readout needs the same Track the canvas built. `resolveTrack` is pure and memoised on both
    // sides, so this is a cheap second call rather than shared mutable state between siblings.
    const track = useMemo( () => resolveTrack( procgenDescriptor( seed ) ), [ seed ] );

    return (
        <Fragment>
            <ArtLabControls
                seed={ seed }
                onSeed={ setSeed }
                envIndex={ envIndex }
                onEnv={ setEnvIndex }
                envNames={ ENV_NAMES }
                bloom={ bloom }
                onBloom={ setBloom }
                layers={ layers }
                onLayer={ toggleLayer }
            />
            <ArtLabReadout track={ track } />
            <ArtLabCanvas seed={ seed } env={ ENV_VARIANTS[ envIndex ] } bloom={ bloom } layers={ layers } />
        </Fragment>
    );
}
