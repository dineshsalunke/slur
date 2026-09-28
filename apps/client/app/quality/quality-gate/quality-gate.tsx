import type { ReactNode } from 'react';
import type { QualityFeature } from '../quality.constants';
import { useQualityProfile } from '../use-quality-profile';

export function QualityGate( {
    feature,
    fallback = null,
    children,
}: {
    feature: QualityFeature;
    fallback?: ReactNode;
    children: ReactNode;
} ) {
    return useQualityProfile()[ feature ] ? children : fallback;
}
