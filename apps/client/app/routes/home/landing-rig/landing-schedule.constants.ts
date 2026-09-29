import { scheduleSystems } from '../../../game/frame/schedule';
import { GAMEPAD_SYSTEM } from '../../../game/input/gamepad';
import { type LandingFrame, landingCamera, landingCruise } from './landing-rig.utils';

export const LANDING_SCHEDULE = scheduleSystems< LandingFrame >( 'landing', [
    GAMEPAD_SYSTEM,
    { id: 'landing.cruise', phase: 'simulate', run: landingCruise },
    { id: 'landing.camera', phase: 'sync', run: landingCamera },
] );
