import { Canvas } from '@react-three/fiber';
import { WorldProvider } from 'koota/react';
import { useEffect } from 'react';
import { LocalPlayer, Prev, Render, Sim } from './ecs/traits';
import { world } from './ecs/world';
import { GameLoop } from './game-loop';
import { attachKeyboard } from './input/keyboard';
import { Scenery } from './scene/scenery';
import { Ships } from './scene/ship';
import { Track } from './scene/track';

export function GameCanvas() {
    // JUSTIFIED EFFECT — syncs with an external system: the browser DOM keyboard (window keydown/keyup).
    //  1) render-derivation? no — key state is a global input stream, not derivable from props/state.
    //  2) event handler? the listeners ARE the handlers; the effect only attaches/detaches them to window.
    //  3) loader/action data? no — RR data flows on navigation, not per-keystroke at 60Hz.
    //  4) ref/module singleton? the input buffer already lives on a module singleton (keyboard.ts); only
    //     the window listener registration needs a mount/unmount lifetime, which a ref can't give.
    //  5) external sync? YES — global DOM events. VERDICT: keep. Syncs window keyboard events; the
    //     addEventListener/removeEventListener pair must bracket the scene's presence — no cheaper idiom.
    useEffect( attachKeyboard, [] );
    // JUSTIFIED EFFECT — syncs with an external system: the koota ECS world (module singleton) — the solo
    // scene needs exactly one local-player entity present while it is mounted.
    //  1) render-derivation? no — spawning is a side effect on an external store, not a render value.
    //  2) event handler? no triggering user event — "scene is active" is the trigger, i.e. mount.
    //  3) loader/action data? no — the solo route loads no data; the entity is client-only ECS state.
    //  4) ref/module singleton? the world IS the singleton, but a module-scope spawn would leak across
    //     remounts (never cleaned) and can't be scoped to this scene's lifetime.
    //  5) external sync? YES — the ECS world. VERDICT: keep. Unlike the Colyseus room, this entity is
    //     cheap, scene-scoped, and SHOULD be recreated on remount (a fresh solo run) — coupling its
    //     lifetime to mount is correct here, not the S2 anti-pattern.
    useEffect( () => {
        const ship = world.spawn( Sim, Prev, Render, LocalPlayer );
        return () => ship.destroy();
    }, [] );

    return (
        <WorldProvider world={ world }>
            <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 75, position: [ 0, 5, -13 ] } }>
                <color attach="background" args={ [ '#05060a' ] } />
                <ambientLight intensity={ 0.5 } />
                <GameLoop />
                <Track />
                <Scenery count={ 50 } />
                <Ships />
            </Canvas>
        </WorldProvider>
    );
}
