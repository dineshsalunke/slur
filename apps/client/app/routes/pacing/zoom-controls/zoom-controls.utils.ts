import { DEFAULT_PPS, MAX_PPS, MIN_PPS } from '../board-scale';
import { GUTTER_PX } from './zoom-controls.constants';

export function currentPps( root: HTMLElement ): number {
    const n = Number( root.dataset.pps );
    return Number.isFinite( n ) && n > 0 ? n : DEFAULT_PPS;
}

export function applyPps( root: HTMLElement, scroller: HTMLElement, next: number ): void {
    const pps = Math.min( MAX_PPS, Math.max( MIN_PPS, next ) );
    const prev = currentPps( root );
    const view = scroller.clientWidth - GUTTER_PX;
    const centre = ( scroller.scrollLeft + view / 2 ) / prev;
    root.dataset.pps = String( pps );
    root.style.setProperty( '--pps', String( pps ) );
    scroller.scrollLeft = centre * pps - view / 2;
}
