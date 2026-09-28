import { Suspense } from 'react';
import { useQuality } from '../../../quality/use-quality';
import { StillBackdrop } from '../../../ui/still-backdrop';
import { LazyLandingScene } from './landing-backdrop.constants';

export function LandingBackdrop() {
    const { backdrop3d } = useQuality();
    if ( ! backdrop3d ) return <StillBackdrop />;
    return (
        <Suspense fallback={ <StillBackdrop /> }>
            <LazyLandingScene />
        </Suspense>
    );
}
