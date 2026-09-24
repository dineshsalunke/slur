import type { MouseEvent } from 'react';

export const GHOST =
    'h-9 cursor-pointer border border-readout/25 bg-deep/60 font-readout text-[12px] font-semibold uppercase tracking-[0.2em] text-readout transition-colors duration-150 hover:border-readout/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-readout';

export const keepFocusOff = ( e: MouseEvent ) => e.preventDefault();
