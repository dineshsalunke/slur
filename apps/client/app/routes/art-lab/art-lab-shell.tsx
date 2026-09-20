import { procgenDescriptor, resolveTrack } from '@slur/shared';
import { Fragment, useMemo, useState } from 'react';
import { DebugPanel } from '../../dev/debug-panel';
import { ENV_VARIANTS } from '../../game/scene/env-config';
import { ArtLabCanvas } from './art-lab-canvas';
import { ArtLabControls } from './art-lab-controls';
import { ArtLabReadout } from './art-lab-readout';
import { DEFAULT_LAB_LAYERS, type LabLayerKey } from './lab-layers';

const ENV_NAMES = ENV_VARIANTS.map( ( v ) => v.name );

/**
 * The lab's structural knobs and the three things that consume them.
 *
 * Per-frame knobs (pause, ghost) must NOT come here; see `lab-state.ts`.
 */
export function ArtLabShell() {
    const [ seed, setSeed ] = useState( 1234 );
    const [ envIndex, setEnvIndex ] = useState( ENV_VARIANTS.length - 1 ); // default C · Grid Void (the locked one)
    const [ bloom, setBloom ] = useState( true );
    const [ layers, setLayers ] = useState( DEFAULT_LAB_LAYERS );
    const toggleLayer = ( key: LabLayerKey ) => setLayers( ( prev ) => ( { ...prev, [ key ]: ! prev[ key ] } ) );

    // `resolveTrack` is pure and memoised on both sides, so the canvas building its own is not a waste.
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
            { import.meta.env.DEV && <DebugPanel /> }
            <ArtLabCanvas seed={ seed } env={ ENV_VARIANTS[ envIndex ] } bloom={ bloom } layers={ layers } />
        </Fragment>
    );
}
