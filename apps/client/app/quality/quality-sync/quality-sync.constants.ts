import { syncQuality } from './quality-sync.state';

export const QUALITY_SYNC_SYSTEM = { id: 'quality.sync', phase: 'react', run: syncQuality } as const;
