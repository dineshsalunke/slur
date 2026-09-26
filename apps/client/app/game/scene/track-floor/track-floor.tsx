import { useFrame } from '@react-three/fiber';
import { LEAD_SEGMENTS } from '@slur/shared';
import { useEffect, useMemo, useRef } from 'react';
import type * as THREE from 'three';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { useTrack } from '../../track-context/use-track';
import { deckBreakupUniforms, patchDeckBreakup, updateDeckBreakup } from '../deck-breakup';
import { applyDeckFinish } from '../deck-finish';
import { patchRailGlow, railGlowUniforms, updateRailGlow } from '../rail-glow';
import { floorSurface, graphiteSurface } from '../track-materials';
import { trackRails } from '../track-rails.state';
import { patchWallBreakup } from '../wall-breakup';
import { FLOOR_SIDE_GROUP, FLOOR_TOP_GROUP } from './track-floor.constants';
import { buildFloorGeometry, segmentCount } from './track-floor.utils';

export interface Buffers {
    pos: number[];
    uv: number[];
}

export function TrackFloor() {
    const track = useTrack();
    const geo = useMemo( () => buildFloorGeometry( track ), [ track ] );
    const segments = segmentCount( track );
    const { mask } = trackRails( track, segments );
    const deckRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const sideRef = useRef< THREE.MeshStandardMaterial | null >( null );
    const rebuild = useRebuildToken();
    const deck = useMemo( floorSurface, [ rebuild ] );
    const side = useMemo( graphiteSurface, [ rebuild ] );
    const glow = useMemo( railGlowUniforms, [] );
    const breakup = useMemo( deckBreakupUniforms, [] );
    const attachDeck = ( mat: THREE.MeshStandardMaterial | null ) => {
        deckRef.current = mat;
        if ( ! mat ) return;
        patchRailGlow( mat, glow );
        patchDeckBreakup( mat, breakup );
    };
    const attachSide = ( mat: THREE.MeshStandardMaterial | null ) => {
        sideRef.current = mat;
        if ( ! mat ) return;
        patchRailGlow( mat, glow );
        patchWallBreakup( mat, breakup );
    };

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    useFrame( () => {
        updateRailGlow( glow, mask, segments + LEAD_SEGMENTS );
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
