import { Bloom } from '@react-three/postprocessing';
import type { BloomConfig } from '../game/scene/env-config';
import { DevBloom } from './dev-bloom';

export function TunedBloom( { config }: { config: BloomConfig } ) {
    if ( import.meta.env.DEV ) return <DevBloom config={ config } />;

    return (
        <Bloom
            mipmapBlur
            intensity={ config.intensity }
            luminanceThreshold={ config.threshold }
            luminanceSmoothing={ config.smoothing }
            radius={ config.radius }
            levels={ config.levels }
        />
    );
}
