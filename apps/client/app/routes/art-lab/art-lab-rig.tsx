import { useFrame } from '@react-three/fiber';
import {
    createFixedStep,
    DEFAULT_SHIP,
    FIXED_DT,
    simulate,
    type Track as TrackHandle,
    tuningForShip,
} from '@slur/shared';
import type { World } from 'koota';
import { useWorld } from 'koota/react';
import { useEffect, useMemo } from 'react';
import type { PerspectiveCamera } from 'three';
import { updateChaseCamera } from '../../game/camera/chase';
import { syncRenderSystem } from '../../game/ecs/systems';
import { LocalPlayer, Net, Prev, Render, Sim } from '../../game/ecs/traits';
import { attachKeyboard, currentInput } from '../../game/input/keyboard';
import { labCommands, labControls } from './lab-state';

// One fixed-step tick. This is `netFlightSystem` MINUS the networking: same Prev-then-simulate order,
// no Predictor (nothing to reconcile without a server) and no Net-trait requirement on the query.
//
// The `prev` copy BEFORE `simulate` is load-bearing and not cosmetic: `syncRenderSystem` lerps Prev→Sim by
// the frame's leftover alpha. Skip the refresh and it interpolates a STALE Prev toward a fresh Sim every
// frame, which reads as a ship vibrating in place — the S4 lobby-jitter bug (memory:
// `gating-a-system-strands-invariants`). Any branch that skips stepping MUST still keep Prev == Sim.
function labFlightStep( world: World, dt: number, track: TrackHandle ): void {
    const input = currentInput();
    world.query( Sim, Prev, Net, LocalPlayer ).updateEach( ( [ s, prev, net ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        simulate( s, input, dt, tuningForShip( net.shipId ), track );
    } );
}

// Ghost advance: no physics, no collision, no death — just slide down the ribbon so the art can be
// inspected without the run ending. Prev is still refreshed so the render lerp stays well-formed.
function ghostStep( world: World, dt: number ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
        s.z += labControls.ghostSpeed * dt;
        s.vz = labControls.ghostSpeed; // the chase cam reads vz for trail-stretch + speed-FOV
        s.dead = false;
        s.y = 0;
        s.grounded = true;
    } );
}

// Hold the render pose exactly where it is. Used while paused — see the Prev note on labFlightStep.
function freezePrev( world: World ): void {
    world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
        prev.x = s.x;
        prev.y = s.y;
        prev.z = s.z;
    } );
}

/**
 * Drives the art lab: owns the single local ship entity, runs the real shared `simulate()` over the real
 * materialized track, and points the real chase camera at it — with no Colyseus room anywhere in the path.
 * That is the whole point: what you see here is what the game renders, not an approximation of it.
 */
export function ArtLabRig( { track }: { track: TrackHandle } ) {
    const world = useWorld();
    const advance = useMemo( () => createFixedStep( FIXED_DT ), [] );

    // JUSTIFIED EFFECT — external sync: window keydown/keyup. `attachKeyboard()` installs the listeners and
    // returns its own teardown, so the Effect is a pure subscribe/unsubscribe bracket, which is the one job
    // Effects are for. Rejected alternatives: React onKeyDown (needs focus + a focusable element, and the
    // Canvas is not one), and a module-level listener installed at import (would keep firing after the route
    // unmounts). No setState, so this never re-renders.
    useEffect( attachKeyboard, [] );

    // JUSTIFIED EFFECT — external sync: the koota world is a module singleton OUTSIDE React, so the lab's
    // entity has to be created in it imperatively and removed on unmount or it leaks into the next route.
    // Precedent: `env-rig.tsx` does exactly this. Rejected alternatives: spawning during render (an impure
    // side effect that double-fires under StrictMode) and spawning in an event handler (there is no event —
    // the entity must exist for the scene's first frame).
    useEffect( () => {
        const e = world.spawn(
            Sim,
            Prev,
            Render,
            Net( { sessionId: 'art-lab', shipId: DEFAULT_SHIP, colorId: 0 } ),
            LocalPlayer,
        );
        return () => e.destroy();
    }, [ world ] );

    useFrame( ( state, delta ) => {
        // Drain any pending teleport BEFORE stepping, so the step and the render lerp agree this frame.
        const jump = labCommands.jumpToZ;
        if ( jump !== null ) {
            labCommands.jumpToZ = null;
            world.query( Sim, Prev, LocalPlayer ).updateEach( ( [ s, prev ] ) => {
                s.z = jump;
                s.x = 0;
                s.y = 0;
                s.vx = 0;
                s.vy = 0;
                s.vz = 0;
                s.dead = false;
                s.respawnTimer = 0;
                s.lastSafeX = 0;
                s.lastSafeZ = jump;
                prev.x = s.x;
                prev.y = s.y;
                prev.z = s.z;
            } );
        }

        const alpha = advance( delta, ( dt ) => {
            if ( labControls.paused ) return;
            if ( labControls.ghost ) ghostStep( world, dt );
            else labFlightStep( world, dt, track );
        } );
        if ( labControls.paused ) freezePrev( world );
        syncRenderSystem( world, alpha );
        updateChaseCamera( state.camera as PerspectiveCamera, world, delta );
    } );

    return null;
}
