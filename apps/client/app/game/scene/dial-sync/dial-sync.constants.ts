import { syncDials } from './dial-sync.state';

export const DIAL_SYNC_SYSTEM = { id: 'scene.dial-sync', phase: 'react', run: syncDials } as const;
