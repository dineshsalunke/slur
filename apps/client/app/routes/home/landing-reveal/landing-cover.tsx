import { StillBackdrop } from '../../../ui/still-backdrop';
import type { Reveal } from './landing-reveal.utils';
import { useRevealShown } from './use-reveal-shown';

export function LandingCover( { reveal }: { reveal: Reveal } ) {
    return useRevealShown( reveal ) ? null : <StillBackdrop />;
}
