import { ACCENT, circlePath, ellipsePath, type GlyphShape, GOLD, plate } from '../../game/scene/power-arc/glyph-shapes';

const PORTAL_RING: GlyphShape = { d: ellipsePath( 24, 24, 9, 14 ), stroke: ACCENT, width: 3 };

export const PORTAL_GLYPH: readonly GlyphShape[] = [
    plate( circlePath( 24, 24, 19 ) ),
    PORTAL_RING,
    { d: ellipsePath( 24, 24, 4, 8 ), stroke: GOLD, width: 2 },
];

export const PORTAL_B_GLYPH: readonly GlyphShape[] = [
    plate( circlePath( 24, 24, 19 ) ),
    PORTAL_RING,
    { d: 'M24 16 A4 8 0 0 1 24 32 Z', fill: GOLD },
];
