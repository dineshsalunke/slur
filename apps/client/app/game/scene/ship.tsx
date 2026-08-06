import { useQuery } from 'koota/react';
import { LocalPlayer, Render } from '../ecs/traits';

// Leaf-local useQuery → re-renders ONLY on ship spawn/despawn, never per frame.
// The <mesh> is parented to the entity's Render group (verified: R3F appendChild does group.add(mesh)).
export function Ships() {
    const ships = useQuery( LocalPlayer, Render );
    return (
        <>
            { ships.map( ( e ) => {
                const group = e.get( Render );
                if ( ! group ) return null;
                return (
                    <primitive key={ e.id() } object={ group }>
                        <mesh>
                            <coneGeometry args={ [ 0.6, 2, 6 ] } />
                            <meshStandardMaterial emissive="#00e5ff" emissiveIntensity={ 2 } toneMapped={ false } />
                        </mesh>
                    </primitive>
                );
            } ) }
        </>
    );
}
