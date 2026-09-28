import { PROFILES, type QualityProfile } from './quality.constants';
import { useQuality } from './use-quality';

export function useQualityProfile(): QualityProfile {
    return PROFILES[ useQuality().tier ];
}
