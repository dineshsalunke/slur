import { Canvas } from '@react-three/fiber';
import type { ShipId, Track } from '@slur/shared';
import { WorldProvider } from 'koota/react';
import { FrameTap } from '../../dev/frame-tap';
import { world } from '../../game/ecs/world';
import { CANVAS_GL } from '../../game/scene/canvas-gl';
import { RearView } from '../../game/scene/rear-view';
import { WorldScene } from '../../game/scene/world-scene';
import { ReplayLoop } from './replay-loop';
import { ReplayShip } from './replay-ship';

export function SongLabCanvas( { track, shipId }: { track: Track; shipId: ShipId } ) {
    return (
        <WorldProvider world={ world }>
            <Canvas gl={ CANVAS_GL } camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }>
                <WorldScene track={ track }>
                    <ReplayShip shipId={ shipId } />
                    <ReplayLoop track={ track } />
                    <RearView />
                    <FrameTap />
                </WorldScene>
            </Canvas>
        </WorldProvider>
    );
}
