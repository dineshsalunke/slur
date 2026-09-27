import { useEffect } from 'react';
import { attachRecordKey } from './flight-recorder.state';

export function useRecordKey(): void {
    // Syncs with the browser keyboard: KeyT starts and stops a flight recording.
    useEffect( attachRecordKey, [] );
}
