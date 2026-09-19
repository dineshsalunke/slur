import { useDebugTuning } from '../../dev/debug-tuning';

/** The scene's one fill term, shared by the game and every isolation lab so a lab frame is never
 *  systematically brighter or darker than the game frame it stands in for. */
export const AMBIENT_INTENSITY = 1;

export function SceneLighting() {
    const tuning = useDebugTuning();
    return <ambientLight intensity={ import.meta.env.DEV ? tuning.ambientIntensity : AMBIENT_INTENSITY } />;
}
