import {
    ACCENT,
    circlePath,
    type GlyphShape,
    GOLD,
    plate,
    polyPath,
    starPoints,
} from '../../game/scene/power-arc/glyph-shapes';

export const SHIELD_GLYPH: readonly GlyphShape[] = [
    plate( circlePath( 24, 24, 19 ) ),
    { d: circlePath( 24, 24, 13 ), stroke: ACCENT, width: 3 },
    { d: polyPath( starPoints( 3, 6, 6 ) ), fill: GOLD },
];
