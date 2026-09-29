import { scheduleSystems } from '../../../game/frame/schedule';
import { type Reveal, revealOnFrame } from './landing-reveal.utils';

export const LANDING_REVEAL_SCHEDULE = scheduleSystems< Reveal >( 'landing-reveal', [
    { id: 'landing.reveal', phase: 'overlay', run: revealOnFrame },
] );
