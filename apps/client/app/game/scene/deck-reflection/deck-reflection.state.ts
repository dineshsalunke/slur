import { reflectionUniforms } from './deck-reflection';
import type { RailSheenUniforms } from './rail-sheen';

export const reflection: RailSheenUniforms = {
    ...reflectionUniforms(),
    uReflRail: { value: 0 },
    uReflRailSpread: { value: 4 },
};
