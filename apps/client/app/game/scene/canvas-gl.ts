import type { RootState } from '@react-three/fiber';
import * as THREE from 'three';

export const CANVAS_GL = {
    toneMapping: THREE.NeutralToneMapping,
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
} as const;

export function prepareRenderer( state: RootState ): void {
    state.gl.debug.checkShaderErrors = import.meta.env.DEV;
}
