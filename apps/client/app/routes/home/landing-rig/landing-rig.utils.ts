import type { RootState } from '@react-three/fiber';
import type { World } from 'koota';
import { LocalPlayer, Sim } from '../../../game/ecs/traits';
import {
    CAMERA_BACK,
    CAMERA_HEIGHT,
    CRUISE,
    LOOK_AHEAD,
    LOOK_HEIGHT,
    PORTRAIT_LOOK_HEIGHT,
} from './landing-rig.constants';

export interface LandingFrame {
    world: World;
    loopZ: number;
    still: boolean;
    ready: boolean;
    z: number;
}

export function landingCruise( f: LandingFrame, _state: RootState, delta: number ): void {
    const sim = f.world.queryFirst( LocalPlayer, Sim )?.get( Sim );
    f.ready = sim !== undefined;
    if ( ! sim ) return;
    sim.vz = f.still ? 0 : CRUISE;
    sim.z = ( sim.z + sim.vz * delta ) % f.loopZ;
    f.z = sim.z;
}

export function landingCamera( f: LandingFrame, state: RootState ): void {
    if ( ! f.ready ) return;
    const cam = state.camera;
    cam.position.set( 0, CAMERA_HEIGHT, f.z - CAMERA_BACK );
    const portrait = state.size.width < state.size.height;
    cam.lookAt( 0, portrait ? PORTRAIT_LOOK_HEIGHT : LOOK_HEIGHT, f.z + LOOK_AHEAD );
}
