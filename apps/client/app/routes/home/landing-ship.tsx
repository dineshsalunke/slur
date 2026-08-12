import { Clone, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useRef } from 'react';
import type { Group } from 'three';
import { LocalPlayer, Sim } from '../../game/ecs/traits';
import { guardLfsPointer } from '../../game/scene/gltf-lfs-guard';
import { shipVisual } from '../../game/scene/ship-visuals';

// The landing hero ship: a single Quaternius model flying just ahead of the drifting camera so the menu
// backdrop reads as "the game in motion", not an empty corridor. COSMETIC ONLY — no ECS death/dissolve, no
// net, no collision. It rides the LandingRig's drift entity (the one LocalPlayer+Sim in this scene) so it
// stays framed as the camera advances, with a gentle bob + a bank into the bob. Preloaded so it never pops.
const HERO_SHIP = 'challenger';
// This is the FIRST model a fresh clone ever loads (`/` renders before any room), so the LFS guard matters
// most here — see gltf-lfs-guard.ts.
useGLTF.preload( shipVisual( HERO_SHIP ).url, undefined, undefined, guardLfsPointer );

const AHEAD = 7; // world units in front of the drift point (LandingRig aims the camera at sim.z + 8)
const REST_Y = 1.2; // hover height the bob oscillates around
const BOB_AMP = 0.35; // vertical bob amplitude (world units)
const BOB_HZ = 0.45; // bob cycles per second — slow, menu-calm
const BANK = 0.16; // peak roll (radians), phased 90° off the bob so it banks as it rises/falls
const TWO_PI = Math.PI * 2;

export function LandingShip() {
    const world = useWorld();
    const ref = useRef< Group >( null );
    const v = shipVisual( HERO_SHIP );
    const { scene } = useGLTF( v.url, undefined, undefined, guardLfsPointer );

    // Leaf-imperative (r3f.md): drive the transform straight into the group ref each frame, no React state.
    // Math.sin/cos here is pure client cosmetics — the deterministic-sim trig ban does NOT apply outside the sim.
    useFrame( ( state ) => {
        const grp = ref.current;
        if ( ! grp ) return;
        const sim = world.queryFirst( LocalPlayer, Sim )?.get( Sim );
        const z = ( sim ? sim.z : 0 ) + AHEAD;
        const phase = state.clock.elapsedTime * BOB_HZ * TWO_PI;
        grp.position.set( 0, REST_Y + Math.sin( phase ) * BOB_AMP, z );
        grp.rotation.z = Math.cos( phase ) * BANK;
    } );

    return (
        <group ref={ ref }>
            <Clone object={ scene } scale={ v.scale * 2 } position={ [ 0, v.lift, 0 ] } rotation={ v.facing } />
        </group>
    );
}
