import { FrameSchedule } from '../../../game/frame/frame-schedule/frame-schedule';
import { LANDING_REVEAL_SCHEDULE } from './landing-reveal.constants';
import type { Reveal } from './landing-reveal.utils';

export function LandingReveal( { reveal }: { reveal: Reveal } ) {
    return <FrameSchedule schedule={ LANDING_REVEAL_SCHEDULE } context={ reveal } />;
}
