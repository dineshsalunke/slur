import { Clone, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { Entity } from 'koota';
import { useCallback, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { rebuildToken } from '../../../dev/tuning-rebuild';
import { accent } from '../accent';
import { guardLfsPointer } from '../gltf-lfs-guard';
import { applyHullLook } from '../hull-look';
import { isDead } from '../ship-dead';
import { SHIP_VISUALS, shipVisual } from '../ship-visuals';
import {
    DISSOLVE_DURATION,
    DISSOLVE_EDGE_INTENSITY,
    DISSOLVE_EDGE_WIDTH,
    DISSOLVE_NOISE_SCALE,
} from './ship-model.constants';
import { collectSurfaces, dressHulls, driveEngines } from './ship-model.utils';

for ( const v of Object.values( SHIP_VISUALS ) ) {
    useGLTF.preload( v.url, undefined, undefined, guardLfsPointer );
}

export interface DissolveUniforms {
    uDissolve: { value: number };
    uNoiseScale: { value: number };
    uEdgeWidth: { value: number };
    uEdgeColor: { value: THREE.Color };
    uEdgeIntensity: { value: number };
}

export interface ShipSurfaces {
    hulls: THREE.MeshStandardMaterial[];
    engines: THREE.MeshStandardMaterial[];
    all: THREE.Material[];
}

export function ShipModel( { entity, shipId }: { entity: Entity; shipId: string } ) {
    const v = shipVisual( shipId );
    const { scene } = useGLTF( v.url, undefined, undefined, guardLfsPointer );
    const cloneRef = useRef< THREE.Group >( null );
    const patched = useRef( false );
    const dressed = useRef( -1 );
    const tinted = useRef( '' );
    const surfaces = useRef< ShipSurfaces >( { hulls: [], engines: [], all: [] } );
    const attachClone = useCallback( ( grp: THREE.Group | null ) => {
        cloneRef.current = grp;
        return () => {
            cloneRef.current = null;
            for ( const mat of surfaces.current.all ) mat.dispose();
        };
    }, [] );
    const uniforms = useMemo< DissolveUniforms >(
        () => ( {
            uDissolve: { value: 0 },
            uNoiseScale: { value: DISSOLVE_NOISE_SCALE },
            uEdgeWidth: { value: DISSOLVE_EDGE_WIDTH },
            uEdgeColor: { value: accent() },
            uEdgeIntensity: { value: DISSOLVE_EDGE_INTENSITY },
        } ),
        [],
    );

    useFrame( ( _state, delta ) => {
        const grp = cloneRef.current;
        if ( ! grp ) return;
        if ( ! patched.current ) {
            surfaces.current = collectSurfaces( grp, uniforms );
            patched.current = true;
            tinted.current = '';
        }
        if ( dressed.current !== rebuildToken() ) {
            dressed.current = rebuildToken();
            dressHulls( surfaces.current.hulls );
        }
        applyHullLook( surfaces.current.hulls, tinted );
        driveEngines( surfaces.current.engines, entity );
        const target = isDead( entity ) ? 1 : 0;
        const u = uniforms.uDissolve;
        const step = delta / DISSOLVE_DURATION;
        if ( u.value < target ) u.value = Math.min( target, u.value + step );
        else if ( u.value > target ) u.value = Math.max( target, u.value - step );
    } );

    return (
        <Clone
            ref={ attachClone }
            object={ scene }
            deep="materialsOnly"
            position={ [ 0, v.lift, 0 ] }
            scale={ v.scale }
            rotation={ v.facing }
        />
    );
}
