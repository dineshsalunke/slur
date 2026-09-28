import { num } from '../../../dev/tuning';
import { qualityProfile } from '../../../quality/quality.state';
import { AUTO_MSAA_MAX_DPR, AUTO_MSAA_SAMPLES } from './scene-effects.constants';

export function msaaSamples( dpr: number ): number {
    const manual = num( 'Render.msaa' );
    if ( manual >= 0 ) return manual;
    if ( ! qualityProfile().msaa ) return 0;
    return dpr < AUTO_MSAA_MAX_DPR ? AUTO_MSAA_SAMPLES : 0;
}
