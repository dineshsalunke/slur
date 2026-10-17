import { ACCENT, type GlyphShape, GOLD, plate, polyPath } from '../../game/scene/power-arc/glyph-shapes';

export const BOOST_GLYPH: readonly GlyphShape[] = [
    plate( polyPath( '24,3 42,21 42,28 24,10 6,28 6,21' ) ),
    plate( polyPath( '24,19 42,37 42,44 24,26 6,44 6,37' ) ),
    { d: polyPath( '24,5 36,17 36,20 24,8 12,20 12,17' ), fill: GOLD },
    { d: polyPath( '24,21 36,33 36,36 24,24 12,36 12,33' ), fill: ACCENT },
];
