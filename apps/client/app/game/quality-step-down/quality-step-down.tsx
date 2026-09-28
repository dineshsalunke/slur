import { PerformanceMonitor } from '@react-three/drei';
import { stepDownQuality } from '../../quality/quality.state';
import { declineBounds } from '../../quality/quality.utils';

export function QualityStepDown() {
    return <PerformanceMonitor bounds={ declineBounds } onDecline={ stepDownQuality } />;
}
