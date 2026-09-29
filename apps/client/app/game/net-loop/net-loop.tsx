import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import type { Predictor } from '../../net/prediction';
import type { RunRoomLike } from '../../net/run-room-like';
import { FrameSchedule } from '../frame/frame-schedule/frame-schedule';
import { useTrack } from '../track-context/use-track';
import { NET_SCHEDULE } from './net-loop.constants';
import { createNetFrame } from './net-loop.utils';

export function NetLoop( { predictor, room }: { predictor: Predictor; room: RunRoomLike } ) {
    const world = useWorld();
    const track = useTrack();
    const frame = useMemo( () => createNetFrame( world, track, predictor, room ), [ world, track, predictor, room ] );
    return <FrameSchedule schedule={ NET_SCHEDULE } context={ frame } />;
}
