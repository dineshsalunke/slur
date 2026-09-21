import { Bloom, EffectComposer } from '@react-three/postprocessing';
import { Fragment } from 'react';
import { GRID_VOID } from '../../game/scene/env-config';
import { useBloom } from './art-gallery-store';

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
