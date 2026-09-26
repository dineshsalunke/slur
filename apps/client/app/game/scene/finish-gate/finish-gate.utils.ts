import { CELL, HALF_WIDTH } from '@slur/shared';
import type { MonolithTransform } from '../monolith-transforms';
import { TILE_HEIGHT, TILE_ROWS } from './finish-gate.constants';

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
