import { Canvas } from '@react-three/fiber';
import { WorldProvider } from 'koota/react';
import { Fragment, useMemo } from 'react';
import { world } from '../../game/ecs/world';
import { CANVAS_GL } from '../../game/scene/canvas-gl';
import { WorldScene } from '../../game/scene/world-scene';
import { TrackContext } from '../../game/track-context/track-context.constants';
import { DeckHud } from './deck-hud';
import { DeckLoop } from './deck-loop/deck-loop';
import { DeckShip } from './deck-ship';
import { deckTrack } from './deck-track';

export function BeatDeckCanvas() {
    const track = useMemo( () => deckTrack(), [] );

    return (
        <Fragment>
            <WorldProvider world={ world }>
                <TrackContext value={ track }>
                    <div className="fixed inset-0">
                        <Canvas gl={ CANVAS_GL } camera={ { fov: 75, near: 1, far: 1000, position: [ 0, 5, -13 ] } }>
                            <WorldScene>
                                <DeckShip />
                                <DeckLoop />
                            </WorldScene>
                        </Canvas>
                    </div>
                </TrackContext>
            </WorldProvider>
            <DeckHud />
        </Fragment>
    );
}
