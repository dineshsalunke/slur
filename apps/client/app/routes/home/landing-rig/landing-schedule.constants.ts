import { scheduleSystems } from '../../../game/frame/schedule';
import { GAMEPAD_SYSTEM } from '../../../game/input/gamepad';
import { DIAL_SYNC_SYSTEM } from '../../../game/scene/dial-sync/dial-sync.constants';
import { type LandingFrame, landingCamera, landingCruise } from './landing-rig.utils';

export const LANDING_SCHEDULE = scheduleSystems< LandingFrame >( 'landing', [
    GAMEPAD_SYSTEM,
    DIAL_SYNC_SYSTEM,
    { id: 'landing.cruise', phase: 'simulate', run: landingCruise },
    { id: 'landing.camera', phase: 'sync', run: landingCamera },
] );
