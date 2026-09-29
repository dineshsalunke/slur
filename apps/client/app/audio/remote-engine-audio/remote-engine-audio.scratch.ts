import { createEngineParams } from '../engine-voice';
import type { PassFrame } from '../movement-edges';

export const params = createEngineParams();
export const mine: PassFrame = { x: 0, z: 0, vz: 0 };
export const theirs: PassFrame = { x: 0, z: 0, vz: 0 };
