import { ACCENT, type GlyphShape, GOLD, plate, polyPath, SHEEN } from '../../game/scene/power-arc/glyph-shapes';

export const BOLT_GLYPH: readonly GlyphShape[] = [
    plate( polyPath( '24,2 38,24 24,46 10,24' ) ),
    { d: polyPath( '24,2 31,24 24,46' ), fill: SHEEN },
    { d: polyPath( '24,12 31,24 24,36 17,24' ), fill: ACCENT },
    { d: polyPath( '24,16 28,24 24,32' ), fill: GOLD },
];
