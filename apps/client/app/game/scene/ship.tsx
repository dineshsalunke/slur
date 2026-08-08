import { useQuery } from 'koota/react';
import { LocalPlayer, Render } from '../ecs/traits';

// Query Render → every ship (local + networked remotes) mounts a mesh; re-renders ONLY on
// spawn/despawn, never per frame. The <mesh> parents to the entity's Render group (R3F appendChild
// does group.add(mesh)). Local ship is cyan, remotes magenta, so the two-laptop test is legible.
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
                        <mesh>
                            <coneGeometry args={ [ 0.6, 2, 6 ] } />
                            <meshStandardMaterial emissive={ color } emissiveIntensity={ 2 } toneMapped={ false } />
                        </mesh>
                    </primitive>
                );
            } ) }
        </>
    );
}
