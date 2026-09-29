import { useWorld } from 'koota/react';
import { useMemo } from 'react';
import { FrameSchedule } from '../../../game/frame/frame-schedule/frame-schedule';
import { useTrack } from '../../../game/track-context/use-track';
import { DECK_SCHEDULE } from './deck-loop.constants';
import { createDeckFrame } from './deck-loop.utils';

export function DeckLoop() {
    const track = useTrack();
    const world = useWorld();
    const frame = useMemo( () => createDeckFrame( world, track ), [ world, track ] );
    return <FrameSchedule schedule={ DECK_SCHEDULE } context={ frame } />;
}
