import { FIRE_BACK_KEY, FIRE_KEY, NEXT_SLOT_KEY, PREVIOUS_SLOT_KEY } from '../../../input/power-select';

export const DPAD_CENTRE = 0.42;
export const DPAD_SLOP = 1.2;

export const ARM_KEYS = {
    up: FIRE_KEY,
    down: FIRE_BACK_KEY,
    left: PREVIOUS_SLOT_KEY,
    right: NEXT_SLOT_KEY,
} as const;

export const ARM =
    'pointer-events-none absolute flex items-center justify-center font-readout text-[11px] font-semibold uppercase tracking-[0.15em] text-readout data-on:text-marigold';
