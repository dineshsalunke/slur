import { useFrame } from '@react-three/fiber';
import { HALF_WIDTH } from '@slur/shared';
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { useRebuildToken } from '../../dev/use-rebuild-token';
import { useTrack } from '../track-context/use-track';
import { segmentCount } from './track-floor';
import {
    BACKWARD,
    DOWN,
    FORWARD,
    packGeometry,
    pushQuad,
    RAIL_LIP_H,
    RAIL_MARGIN,
    RAIL_W,
    SLAB_THICKNESS,
    UP,
    type V3,
} from './track-geometry';
import { BOUNDARY_SURFACE, cleanToMapRoughness, railBodySurface } from './track-materials';
import { buildRailRuns, type RailRun } from './track-rails';

export function buildRailGeometry( runs: RailRun[] ): THREE.BufferGeometry {
    const metalPos: number[] = [];
    const metalUv: number[] = [];
    const stripPos: number[] = [];
    const stripUv: number[] = [];

    for ( const run of runs ) {
        const s = Math.sign( run.x );
        const a0 = s * HALF_WIDTH;
        const a1 = s * ( HALF_WIDTH + RAIL_MARGIN );
        const a2 = s * ( HALF_WIDTH + RAIL_W - RAIL_MARGIN );
        const a3 = s * ( HALF_WIDTH + RAIL_W );
        const t = run.y;
        const b = t - SLAB_THICKNESS;
        const { z0, z1 } = run;
        const outward: V3 = [ s, 0, 0 ];

        pushQuad( metalPos, metalUv, [ a0, t, z0 ], [ a0, t, z1 ], [ a1, t, z1 ], [ a1, t, z0 ], 'xz', UP );
        pushQuad( metalPos, metalUv, [ a2, t, z0 ], [ a2, t, z1 ], [ a3, t, z1 ], [ a3, t, z0 ], 'xz', UP );
        pushQuad( metalPos, metalUv, [ a3, b, z0 ], [ a3, t, z0 ], [ a3, t, z1 ], [ a3, b, z1 ], 'zy', outward );
        pushQuad( metalPos, metalUv, [ a0, b, z0 ], [ a0, b, z1 ], [ a3, b, z1 ], [ a3, b, z0 ], 'xz', DOWN );
        pushQuad( metalPos, metalUv, [ a0, b, z0 ], [ a3, b, z0 ], [ a3, t, z0 ], [ a0, t, z0 ], 'xy', BACKWARD );
        pushQuad( metalPos, metalUv, [ a0, b, z1 ], [ a3, b, z1 ], [ a3, t, z1 ], [ a0, t, z1 ], 'xy', FORWARD );

        const inward: V3 = [ -s, 0, 0 ];
        const h = t + RAIL_LIP_H;
        pushQuad( stripPos, stripUv, [ a1, h, z0 ], [ a1, h, z1 ], [ a2, h, z1 ], [ a2, h, z0 ], 'xz', UP );
        pushQuad( stripPos, stripUv, [ a1, t, z0 ], [ a1, h, z0 ], [ a1, h, z1 ], [ a1, t, z1 ], 'zy', inward );
        pushQuad( stripPos, stripUv, [ a2, t, z0 ], [ a2, h, z0 ], [ a2, h, z1 ], [ a2, t, z1 ], 'zy', outward );
        pushQuad( stripPos, stripUv, [ a1, t, z0 ], [ a2, t, z0 ], [ a2, h, z0 ], [ a1, h, z0 ], 'xy', BACKWARD );
        pushQuad( stripPos, stripUv, [ a1, t, z1 ], [ a2, t, z1 ], [ a2, h, z1 ], [ a1, h, z1 ], 'xy', FORWARD );
    }

    const geo = packGeometry( [ ...metalPos, ...stripPos ], [ ...metalUv, ...stripUv ] );
    const metalCount = metalPos.length / 3;
    geo.addGroup( 0, metalCount, 0 );
    geo.addGroup( metalCount, stripPos.length / 3, 1 );
    return geo;
}

export function TrackRail() {
    const track = useTrack();
    const runs = useMemo( () => buildRailRuns( track, segmentCount( track ) ), [ track ] );
    const geo = useMemo( () => buildRailGeometry( runs ), [ runs ] );
    const rebuild = useRebuildToken();
    const materials = useMemo( () => {
        return [
            new THREE.MeshStandardMaterial( railBodySurface() ),
            new THREE.MeshStandardMaterial( BOUNDARY_SURFACE ),
        ];
    }, [ rebuild ] );

    // GPU buffers outlive React's tree: a geometry replaced by a new track must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    // GPU programs and textures outlive React's tree: a material replaced by a rebuild must be released by hand.
    useEffect(
        () => () => {
            for ( const m of materials ) m.dispose();
        },
        [ materials ],
    );

    useFrame( () => {
        const [ metal, strip ] = materials;
        const scale = num( 'Rail.normalScale' );
        metal.metalness = num( 'Rail.metalness' );
        metal.roughness = cleanToMapRoughness( num( 'Rail.roughness' ) );
        metal.envMapIntensity = num( 'Rail.envMapIntensity' );
        metal.normalScale.set( scale, scale );
        strip.emissiveIntensity = num( 'Rail.railEmissive' );
    } );

    return <mesh geometry={ geo } material={ materials } />;
}
