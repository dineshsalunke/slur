import { useSyncExternalStore } from 'react';
import { type RecorderView, recorderView, subscribeRecorder } from './flight-recorder.state';

export function useRecorder< T >( select: ( v: RecorderView ) => T ): T {
    const read = () => select( recorderView() );
    return useSyncExternalStore( subscribeRecorder, read, read );
}
