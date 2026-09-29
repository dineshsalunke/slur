import { POWER_SLOTS } from '@slur/shared';

export const CELLS = 9;
export const CELL_PX = 128;
export const CELL_PAD = 10;
export const VIEWBOX = 48;

export const ARC_LAYER = 2;
export const ARC_ORDER = 20;
export const INSTANCES = POWER_SLOTS + 1;

export const GLYPH = 1.1;
export const SELECTED_SCALE = 1.15;
export const PITCH = 1.5;
export const SAG = 0.25;
export const GAP = 1.2;
export const MIN_BACK = 3.4;
export const DROP = 0.1;

export const FLASH_LIFT = 2.5;
export const FLASH_SCALE = 3;
export const FLASH_S = 0.45;
export const PULSE = 0.25;
export const PULSE_S = 0.12;

export const LOOK = {
    selected: { gain: 2.2, alpha: 1 },
    held: { gain: 0.35, alpha: 0.7 },
    emptySelected: { gain: 0.9, alpha: 0.55 },
    empty: { gain: 0.5, alpha: 0.3 },
    flash: { gain: 3, alpha: 1 },
} as const;

export const VERTEX = `
attribute float aCell;
attribute float aGain;
attribute float aAlpha;
varying vec2 vUv;
varying float vGain;
varying float vAlpha;
void main() {
    vUv = vec2( ( uv.x + aCell ) / ${ CELLS }.0, uv.y );
    vGain = aGain;
    vAlpha = aAlpha;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4( position, 1.0 );
}
`;

export const FRAGMENT = `
uniform sampler2D uMap;
varying vec2 vUv;
varying float vGain;
varying float vAlpha;
void main() {
    vec4 t = texture2D( uMap, vUv );
    gl_FragColor = vec4( t.rgb * vGain, t.a * vAlpha );
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
}
`;
