import { procgenDescriptor, resolveTrack } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { useMemo, useState } from 'react';
import { world } from '../../game/ecs/world';
import { ENV_VARIANTS } from '../../game/scene/env-config';
import { ArtLabCanvas } from './art-lab-canvas';
import { ArtLabControls } from './art-lab-controls';
import { ArtLabReadout } from './art-lab-readout';
import { DEFAULT_LAB_LAYERS, type LabLayerKey } from './lab-layers';

export function meta() {
    return [ { title: 'SLUR — Art Lab' } ];
}

const ENV_NAMES = ENV_VARIANTS.map( ( v ) => v.name );

/**
 * `/art-lab` — the art review instrument.
 *
 * Fly the REAL generated track with the REAL chase camera and REAL collision, at true scale, with the
 * knobs an art review actually needs: A/B/C environment, bloom on/off, seed, and jump-to-section. No
 * server, no room — `resolveTrack` is pure and `simulate()` takes the track as an argument.
 *
 * WHY THIS EXISTS: every art decision in `docs/art-direction/` was made against concept
 * boards drawn at the wrong scale (see `docs/ART_SCALE_REFERENCE.md` — the track is 64u wide and the
 * boards drew it at 6–8u). This route is where those decisions get checked against the thing that ships.
 *
 * Structural knobs (seed, env, bloom, layer visibility) are React state HERE and flow down as props —
 * changing them is a genuine structural change that SHOULD re-render the scene. Per-frame knobs (pause,
 * ghost) deliberately do not live here; see `lab-state.ts` for why.
 */
export default function ArtLabRoute() {
    const [ seed, setSeed ] = useState( 1234 );
    const [ envIndex, setEnvIndex ] = useState( ENV_VARIANTS.length - 1 ); // default C · Grid Void (the locked one)
    const [ bloom, setBloom ] = useState( true );
    // Track-only by default — see `lab-layers.ts`. Functional update so the handler never closes over a
    // stale `layers`, which matters because the controls leaf holds this callback across re-renders.
    const [ layers, setLayers ] = useState( DEFAULT_LAB_LAYERS );
    const toggleLayer = ( key: LabLayerKey ) => setLayers( ( prev ) => ( { ...prev, [ key ]: ! prev[ key ] } ) );

    // The readout needs the same Track the canvas built. `resolveTrack` is pure and memoised on both
    // sides, so this is a cheap second call rather than shared mutable state between siblings.
    const track = useMemo( () => resolveTrack( procgenDescriptor( seed ) ), [ seed ] );

    return (
        <WorldProvider world={ world }>
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
        </WorldProvider>
    );
}
