import { CELL, HALF_WIDTH } from '@slur/shared';
import { Fragment, useMemo } from 'react';
import { useTrack } from '../track-context/use-track';
import { ACCENT_ANCHOR } from './accent';
import { BOLT_HOT } from './combat-look';
import { FinishOutline } from './finish-outline/finish-outline';
import { GATE_FRAME, outlineStrips } from './monolith-frame';
import { MonolithFrames } from './monolith-frames/monolith-frames';
import type { MonolithTransform } from './monolith-transforms';
import { MARIGOLD_REFERENCE_INTENSITY } from './track-materials';
import { useRailMask } from './use-rail-mask';

const BAND_WIDTH = 4;
const BAND_PROUD = 0.4;
const CORE_WIDTH = 1.25;
const CORE_PROUD = 0.8;
const GLOW_INTENSITY = MARIGOLD_REFERENCE_INTENSITY * 2;
const TILE_ROWS = 3;
const TILE_HEIGHT = 0.12;

export function finishTiles( finishZ: number ): MonolithTransform[] {
    const columns = Math.round( ( HALF_WIDTH * 2 ) / CELL );
    const tiles: MonolithTransform[] = [];
    for ( let row = 0; row < TILE_ROWS; row++ ) {
        for ( let col = 0; col < columns; col++ ) {
            if ( ( row + col ) % 2 !== 0 ) continue;
            tiles.push( {
                position: [
                    -HALF_WIDTH + ( col + 0.5 ) * CELL,
                    TILE_HEIGHT / 2,
                    finishZ + ( row - ( TILE_ROWS - 1 ) / 2 ) * CELL,
                ],
                scale: [ CELL, TILE_HEIGHT, CELL ],
                rotationY: 0,
                rotationZ: 0,
            } );
        }
    }
    return tiles;
}

export function FinishGate() {
    const track = useTrack();
    const gate = useMemo( () => [ { z: track.finishZ, height: GATE_FRAME.height } ], [ track.finishZ ] );
    const band = useMemo( () => outlineStrips( GATE_FRAME, gate[ 0 ], BAND_WIDTH, BAND_PROUD ), [ gate ] );
    const core = useMemo( () => outlineStrips( GATE_FRAME, gate[ 0 ], CORE_WIDTH, CORE_PROUD ), [ gate ] );
    const tiles = useMemo( () => finishTiles( track.finishZ ), [ track.finishZ ] );
    const railMask = useRailMask( track );
    return (
        <Fragment>
            <MonolithFrames frame={ GATE_FRAME } placements={ gate } railMask={ railMask } />
            <FinishOutline strips={ band } emissive={ ACCENT_ANCHOR } intensity={ GLOW_INTENSITY } />
            <FinishOutline strips={ core } emissive={ BOLT_HOT } intensity={ GLOW_INTENSITY } />
            <FinishOutline strips={ tiles } emissive={ ACCENT_ANCHOR } intensity={ GLOW_INTENSITY } />
        </Fragment>
    );
}
