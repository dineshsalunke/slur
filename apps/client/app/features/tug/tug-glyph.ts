import { circlePath, type GlyphShape, inlay, polyPath, VOID } from '../../game/scene/power-arc/glyph-shapes';

export const TUG_GLYPH: readonly GlyphShape[] = [
    ...inlay( polyPath( '17.1,12.4 22.1,7.4 23.7,8.5 18.5,14' ) ),
    ...inlay( polyPath( '26.1,5.4 29.1,15.5 15.1,30.6 24.4,43.9 16,43.9 6.6,31.9' ) ),
    ...inlay( polyPath( '21.3,27.1 27.6,35.9 34.3,35.9 39.2,28.6 41.4,30.3 35.5,40.7 25.1,40.7 17.9,31.3' ) ),
    ...inlay( polyPath( '40.3,14 36.3,18 30.6,18 26.6,14 26.6,8.3 30.6,4.3 36.3,4.3 40.3,8.3' ) ),
    { d: circlePath( 32.4, 11.5, 3.4 ), fill: VOID },
];
