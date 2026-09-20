import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Fragment } from 'react';
import { GRID_VOID } from '../../game/scene/env-config';
import { useBloom } from './art-gallery-store';

// The same bloom config the game pins, so what you judge here is what ships. Toggling it off is a
// first-class review mode: the handoff requires readability to survive without bloom.
export function GalleryBloom() {
    if ( ! useBloom() ) return <Fragment />;

    return (
        <EffectComposer multisampling={ 0 }>
            <Bloom
                mipmapBlur
                intensity={ GRID_VOID.bloom.intensity }
                luminanceThreshold={ GRID_VOID.bloom.threshold }
                luminanceSmoothing={ GRID_VOID.bloom.smoothing }
                radius={ GRID_VOID.bloom.radius }
                levels={ GRID_VOID.bloom.levels }
            />
        </EffectComposer>
    );
}
