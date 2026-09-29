import { scheduleSystems } from '../../frame/schedule';
import { syncDials } from './dial-sync.state';

export const DIAL_SYNC_SYSTEM = { id: 'scene.dial-sync', phase: 'react', run: syncDials } as const;

export const DIAL_SYNC_SCHEDULE = scheduleSystems< null >( 'dial-sync', [ DIAL_SYNC_SYSTEM ] );
