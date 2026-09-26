import { DEFAULT_PPS } from '../board-scale';

export function initScale( el: HTMLElement | null, duration: number ): void {
    if ( ! el ) return;
    el.style.setProperty( '--duration', String( duration ) );
    if ( el.dataset.pps === undefined ) {
        el.dataset.pps = String( DEFAULT_PPS );
        el.style.setProperty( '--pps', String( DEFAULT_PPS ) );
    }
}
