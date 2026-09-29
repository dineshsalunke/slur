import { scheduleSystems } from '../../frame/schedule';
import { renderScene, type ScenePipeline, syncPost } from './scene-effects.utils';

export const SCENE_RENDER_SCHEDULE = scheduleSystems< ScenePipeline >( 'render', [
    { id: 'render.post', phase: 'view', run: syncPost },
    { id: 'render.frame', phase: 'render', run: renderScene },
] );
