import { useQuality } from '../../../quality/use-quality';
import { StillBackdrop } from '../../../ui/still-backdrop';
import { LiveBackdrop } from './live-backdrop';

export function LandingBackdrop() {
    const { backdrop3d } = useQuality();
    return backdrop3d ? <LiveBackdrop /> : <StillBackdrop />;
}
