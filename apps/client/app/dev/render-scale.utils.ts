import { qualityProfile } from '../quality/quality.state';
import { autoDpr } from '../quality/quality.utils';
import { num } from './tuning';

export function renderDpr(): number {
    const manual = num( 'Render.dpr' );
    if ( manual > 0 ) return manual;
    return autoDpr( globalThis.devicePixelRatio ?? 1, qualityProfile().dprCap );
}
