import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { useTrack } from '../../track-context/use-track';
import { deckBreakupUniforms, patchDeckBreakup, updateDeckBreakup } from '../deck-breakup';
import { applyDeckFinish } from '../deck-finish';
import { floorSurface, graphiteSurface } from '../track-materials';
import { patchWallBreakup } from '../wall-breakup';
import { FLOOR_SIDE_GROUP, FLOOR_TOP_GROUP } from './track-floor.constants';
import { buildFloorGeometry } from './track-floor.utils';

export interface Buffers {
    pos: number[];
    uv: number[];
}

export function TrackFloor() {
    const track = useTrack();
    const geo = useMemo( () => buildFloorGeometry( track ), [ track ] );
    const deckRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const sideRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const rebuild = useRebuildToken();
    const deck = useMemo( floorSurface, [ rebuild ] );
    const side = useMemo( graphiteSurface, [ rebuild ] );
    const breakup = useMemo( deckBreakupUniforms, [] );
    const attachDeck = ( mat: THREE.MeshStandardMaterial | null ) => {
        deckRef.current = mat;
        if ( ! mat ) return;
        patchDeckBreakup( mat, breakup );
    };
    const attachSide = ( mat: THREE.MeshStandardMaterial | null ) => {
        sideRef.current = mat;
        if ( ! mat ) return;
        patchWallBreakup( mat, breakup );
    };

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    useFrame( () => {
        updateDeckBreakup( breakup, deck.map );
        if ( deckRef.current ) applyDeckFinish( deckRef.current );
        if ( sideRef.current ) applyDeckFinish( sideRef.current );
    } );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial attach={ `material-${ FLOOR_TOP_GROUP }` } ref={ attachDeck } { ...deck } />
            <meshStandardMaterial attach={ `material-${ FLOOR_SIDE_GROUP }` } ref={ attachSide } { ...side } />
        </mesh>
    );
}
