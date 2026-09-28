import { PHASE } from '@slur/shared';

export const PHASE_VIEW: Record< number, { label: string; live: boolean } > = {
    [ PHASE.lobby ]: { label: 'Lobby', live: false },
    [ PHASE.countdown ]: { label: 'Starting', live: false },
    [ PHASE.racing ]: { label: 'Racing', live: true },
    [ PHASE.finished ]: { label: 'Results', live: true },
};

export const SECONDARY_BUTTON =
    'inline-flex h-11 cursor-pointer items-center justify-center whitespace-nowrap border border-readout/25 bg-deep px-5 text-[14px] font-bold uppercase tracking-[0.2em] text-readout transition-colors duration-150 enabled:hover:border-marigold enabled:hover:text-marigold focus-visible:border-marigold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-readout disabled:cursor-wait disabled:opacity-60';
