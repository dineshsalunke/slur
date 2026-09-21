import { Bloom } from '@react-three/postprocessing';
import type { BloomConfig } from './env-config';

export function SceneBloom( { config }: { config: BloomConfig } ) {
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
