import * as THREE from 'three';

export const CANVAS_GL = {
    toneMapping: THREE.NeutralToneMapping,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
} as const;
