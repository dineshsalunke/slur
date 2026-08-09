import { Clone, useGLTF } from '@react-three/drei';
import { Fragment } from 'react';
import { SHIP_VISUALS, shipVisual } from './ship-visuals';

// Per-ship model (Quaternius CC0). useGLTF caches by URL, so each model loads once; drei <Clone>
// deep-clones it per entity so many ships mount independently while sharing geometry/material. The parent
// (ShipView) keys this on shipId, so a class hot-swap remounts with the new model. scale/lift/facing come
// from ship-visuals.ts, DERIVED so the model box == the class AABB footprint (WYSIWYG collision).
for ( const v of Object.values( SHIP_VISUALS ) ) useGLTF.preload( v.url ); // preload all 5 → no hot-swap hitch

export function ShipModel( { shipId, color }: { shipId: string; color: string } ) {
    const v = shipVisual( shipId );
    const { scene } = useGLTF( v.url );
    return (
        <Fragment>
            <Clone object={ scene } position={ [ 0, v.lift, 0 ] } scale={ v.scale } rotation={ v.facing } />
            { /* team-colour beacon (emissive, blooms) so local=cyan vs remote=magenta stays legible —
                 an unlit mesh, NOT a pointLight, to avoid the many-dynamic-lights perf cliff. */ }
            <mesh position={ [ 0, 1, 0 ] }>
                <sphereGeometry args={ [ 0.22, 12, 12 ] } />
                <meshStandardMaterial emissive={ color } emissiveIntensity={ 3 } toneMapped={ false } />
            </mesh>
        </Fragment>
    );
}
