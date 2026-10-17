import {
    ACCENT,
    circlePath,
    type GlyphShape,
    GOLD,
    plate,
    polyPath,
    starPoints,
} from '../../game/scene/power-arc/glyph-shapes';

export const MINE_GLYPH: readonly GlyphShape[] = [
    plate( polyPath( starPoints( 8, 22, 11 ) ) ),
    { d: circlePath( 24, 24, 6.5 ), fill: ACCENT },
    { d: circlePath( 24, 24, 3.2 ), fill: GOLD },
];
