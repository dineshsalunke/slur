import {
    ACCENT,
    circlePath,
    type GlyphShape,
    GOLD,
    plate,
    roundRectPath,
} from '../../game/scene/power-arc/glyph-shapes';

export const SEEKER_GLYPH: readonly GlyphShape[] = [
    plate( roundRectPath( 9, 9, 30, 30, 5 ) ),
    { d: circlePath( 24, 24, 8 ), fill: ACCENT },
    { d: circlePath( 24, 24, 4 ), fill: GOLD },
];
