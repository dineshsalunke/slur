import { num } from '../../../dev/tuning';
import { AUTO_MSAA_MAX_DPR, AUTO_MSAA_SAMPLES } from './scene-effects.constants';

export function msaaSamples( dpr: number ): number {
    const manual = num( 'Render.msaa' );
    if ( manual >= 0 ) return manual;
    return dpr < AUTO_MSAA_MAX_DPR ? AUTO_MSAA_SAMPLES : 0;
}
