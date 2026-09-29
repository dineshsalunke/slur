import { scheduleSystems } from '../../../game/frame/schedule';
import { type LandingFrame, landingCamera, landingCruise } from './landing-rig.utils';

export const LANDING_SCHEDULE = scheduleSystems< LandingFrame >( 'landing', [
    { id: 'landing.cruise', phase: 'simulate', run: landingCruise },
    { id: 'landing.camera', phase: 'sync', run: landingCamera },
] );
