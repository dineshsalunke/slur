import { useFrame } from '@react-three/fiber';
import { useWorld } from 'koota/react';
import { useCallback, useMemo } from 'react';
import type * as THREE from 'three';
import { repaintGlyphs } from './glyph-atlas';
import { ARC_LAYER, ARC_ORDER, INSTANCES } from './power-arc.constants';
import { createArcFrame, stepArc } from './power-arc.state';
import { buildArcLook, disposeArcLook } from './power-arc.utils';

export function PowerArc() {
    const world = useWorld();
    const look = useMemo( buildArcLook, [] );
    const frame = useMemo( createArcFrame, [] );

    const setMesh = useCallback(
        ( mesh: THREE.InstancedMesh | null ) => {
            if ( ! mesh ) return;
            frame.mesh = mesh;
            mesh.layers.set( ARC_LAYER );
            mesh.count = 0;
            return () => {
                frame.mesh = null;
                disposeArcLook( look );
            };
        },
        [ frame, look ],
    );

    useFrame( ( state, delta ) => {
        repaintGlyphs( look.texture );
        stepArc( frame, look, world, state.camera, delta );
    } );

    return (
        <instancedMesh
            ref={ setMesh }
            frustumCulled={ false }
            renderOrder={ ARC_ORDER }
            args={ [ look.geometry, look.material, INSTANCES ] }
        />
    );
}
