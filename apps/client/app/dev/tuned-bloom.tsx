import { Bloom } from '@react-three/postprocessing';
import type { BloomConfig } from '../game/scene/env-config';
import { useDebugTuning } from './debug-tuning';

/** `radius` and `levels` are constructor arguments, so they cannot be changed on a live effect — the
 *  key remounts the pass instead of pretending they took. */
export function TunedBloom( { config }: { config: BloomConfig } ) {
    const tuning = useDebugTuning();
    const c = import.meta.env.DEV
        ? {
              intensity: tuning.bloomIntensity,
              threshold: tuning.bloomThreshold,
              smoothing: tuning.bloomSmoothing,
              radius: tuning.bloomRadius,
              levels: tuning.bloomLevels,
          }
        : config;

    return (
        <Bloom
            key={ `${ c.radius }:${ c.levels }` }
            mipmapBlur
            intensity={ c.intensity }
            luminanceThreshold={ c.threshold }
            luminanceSmoothing={ c.smoothing }
            radius={ c.radius }
            levels={ c.levels }
        />
    );
}
