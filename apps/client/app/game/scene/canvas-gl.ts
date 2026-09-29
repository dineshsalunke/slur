import type { RootState } from '@react-three/fiber';
import { toneMode } from './tone-mapping';

export const CANVAS_GL = {
    toneMapping: toneMode(),
    antialias: false,
    alpha: false,
    powerPreference: 'high-performance',
} as const;

export function prepareRenderer( state: RootState ): void {
    state.gl.debug.checkShaderErrors = import.meta.env.DEV;
}
