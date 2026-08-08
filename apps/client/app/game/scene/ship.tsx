import { Clone, useGLTF } from '@react-three/drei';
import { useQuery } from 'koota/react';
import { Suspense } from 'react';
import { LocalPlayer, Render } from '../ecs/traits';

// First real ship model (Quaternius CC0). useGLTF caches by URL, so the model loads once; drei <Clone>
// deep-clones it per entity so many ships mount independently while sharing geometry/material.
// SHIP_SCALE / SHIP_FACING are placeholders — tune them live against the track (the model's native
// size + forward axis are unknown until we see it; flip SHIP_FACING if the nose points backward).
const SHIP_URL = '/models/ships/bob.gltf';
useGLTF.preload( SHIP_URL );

// Measured from bob.gltf accessor bounds (jq on the glTF): wingspan X = 10.50, height Y = 2.04 with the
// hull BOTTOM at y = -0.874 (the model origin is NOT its base), length Z = 5.61. Scale + lift are
// DERIVED from those so the ship is a sane fraction of the 32u-wide track and rests ON the floor.
const MODEL_WINGSPAN = 10.502; // X extent (model space)
const MODEL_MIN_Y = -0.8742; // hull bottom (model space) — how far the origin sits above the base
const TARGET_WINGSPAN = 3.5; // desired on-track wingspan (~11% of the 2×halfWidth=32 track)
const SHIP_SCALE = TARGET_WINGSPAN / MODEL_WINGSPAN; // ≈ 0.333
const SHIP_LIFT = -MODEL_MIN_Y * SHIP_SCALE; // raise so the hull bottom sits at y=0 (on the floor)
const SHIP_FACING: [ number, number, number ] = [ 0, 0, 0 ]; // model +Z = forward; flip to [0, Math.PI, 0] if the nose faces the camera

function ShipModel( { color }: { color: string } ) {
    const { scene } = useGLTF( SHIP_URL );
    return (
        <>
            <Clone object={ scene } position={ [ 0, SHIP_LIFT, 0 ] } scale={ SHIP_SCALE } rotation={ SHIP_FACING } />
            { /* team-colour beacon (emissive, blooms) so local=cyan vs remote=magenta stays legible —
                 an unlit mesh, NOT a pointLight, to avoid the many-dynamic-lights perf cliff. */ }
            <mesh position={ [ 0, 1, 0 ] }>
                <sphereGeometry args={ [ 0.22, 12, 12 ] } />
                <meshStandardMaterial emissive={ color } emissiveIntensity={ 3 } toneMapped={ false } />
            </mesh>
        </>
    );
}

// Query Render → every ship (local + remote) mounts a model; re-renders ONLY on spawn/despawn, never
// per frame. The content parents to the entity's Render group (R3F appendChild → group.add).
export function Ships() {
    const ships = useQuery( Render );
    return (
        <>
            { ships.map( ( e ) => {
                const group = e.get( Render );
                if ( ! group ) return null;
                const color = e.has( LocalPlayer ) ? '#00e5ff' : '#ff2bd6';
                return (
                    <primitive key={ e.id() } object={ group }>
                        <Suspense fallback={ null }>
                            <ShipModel color={ color } />
                        </Suspense>
                    </primitive>
                );
            } ) }
        </>
    );
}
