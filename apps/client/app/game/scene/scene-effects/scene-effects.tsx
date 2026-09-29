import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import { FrameSchedule } from '../../frame/frame-schedule/frame-schedule';
import { disposeComposer, type ScenePipeline } from './scene-effects.utils';
import { SCENE_RENDER_SCHEDULE } from './scene-effects-schedule.constants';

export function SceneEffects() {
    const world = useWorld();
    const pipeline = useMemo< ScenePipeline >(
        () => ( { world, composer: null, effects: [], tone: null, size: null, camera: null } ),
        [ world ],
    );

    // GPU render targets outlive React's tree: the composer's GPU resources must be released by hand.
    useEffect( () => () => disposeComposer( pipeline ), [ pipeline ] );

    return <FrameSchedule schedule={ SCENE_RENDER_SCHEDULE } context={ pipeline } />;
}
