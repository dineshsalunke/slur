import type { Track } from '@slur/shared';
import { useContext } from 'react';
import { TrackContext } from './track-context.constants';

export function useTrack(): Track {
    const track = useContext( TrackContext );
    if ( ! track ) throw new Error( 'useTrack must be used within <TrackContext>' );
    return track;
}
