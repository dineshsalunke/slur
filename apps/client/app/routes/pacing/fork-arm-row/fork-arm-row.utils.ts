import { LEAD_S } from './fork-arm-row.constants';

export function scrollToFork( el: HTMLElement, seconds: number ): void {
    const scroller = el.closest< HTMLElement >( '[data-pacing-scroller]' );
    if ( ! scroller ) return;
    const pps = Number( getComputedStyle( scroller ).getPropertyValue( '--pps' ) );
    if ( Number.isFinite( pps ) && pps > 0 ) scroller.scrollTo( { left: Math.max( 0, ( seconds - LEAD_S ) * pps ) } );
}
