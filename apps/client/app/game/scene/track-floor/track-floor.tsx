import { useCallback, useEffect, useMemo } from 'react';
import type * as THREE from 'three';
import { useRebuildToken } from '../../../dev/use-rebuild-token';
import { useTrack } from '../../track-context/use-track';
import { deckBreakupUniforms, patchDeckBreakup, updateDeckBreakup } from '../deck-breakup';
import { applyDeckFinish } from '../deck-finish';
import { updateReflection } from '../deck-reflection/deck-reflection';
import { reflection } from '../deck-reflection/deck-reflection.state';
import { patchRailSheen, updateRailSheen } from '../deck-reflection/rail-sheen';
import { registerDialSync } from '../dial-sync/dial-sync.state';
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
    const rebuild = useRebuildToken();
    const deck = useMemo( floorSurface, [ rebuild ] );
    const side = useMemo( graphiteSurface, [ rebuild ] );
    const breakup = useMemo( deckBreakupUniforms, [] );
    const attachDeck = useCallback(
        ( mat: THREE.MeshStandardMaterial | null ) => {
            if ( ! mat ) return;
            patchDeckBreakup( mat, breakup );
            patchRailSheen( mat, reflection );
            return registerDialSync( () => {
                updateDeckBreakup( breakup, deck.map );
                applyDeckFinish( mat );
                updateReflection( reflection, mat );
                updateRailSheen( reflection );
            } );
        },
        [ breakup, deck ],
    );
    const attachSide = useCallback(
        ( mat: THREE.MeshStandardMaterial | null ) => {
            if ( ! mat ) return;
            patchWallBreakup( mat, breakup );
            return registerDialSync( () => applyDeckFinish( mat ) );
        },
        [ breakup, side ],
    );

    // GPU buffers outlive React's tree: a geometry replaced by a width change must be released by hand.
    useEffect( () => () => geo.dispose(), [ geo ] );

    return (
        <mesh geometry={ geo }>
            <meshStandardMaterial attach={ `material-${ FLOOR_TOP_GROUP }` } ref={ attachDeck } { ...deck } />
            <meshStandardMaterial attach={ `material-${ FLOOR_SIDE_GROUP }` } ref={ attachSide } { ...side } />
        </mesh>
    );
}
