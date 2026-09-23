import type { RefObject } from 'react';
import { DEFAULT_PPS, MAX_PPS, MIN_PPS, ZOOM_STEP } from './board-scale';

const GUTTER_PX = 176;
const BUTTON = 'rounded border border-line-2 px-2 py-0.5 text-xs text-fg hover:border-marigold hover:text-marigold';

function currentPps( root: HTMLElement ): number {
    const n = Number( root.dataset.pps );
    return Number.isFinite( n ) && n > 0 ? n : DEFAULT_PPS;
}

function applyPps( root: HTMLElement, scroller: HTMLElement, next: number ): void {
    const pps = Math.min( MAX_PPS, Math.max( MIN_PPS, next ) );
    const prev = currentPps( root );
    const view = scroller.clientWidth - GUTTER_PX;
    const centre = ( scroller.scrollLeft + view / 2 ) / prev;
    root.dataset.pps = String( pps );
    root.style.setProperty( '--pps', String( pps ) );
    scroller.scrollLeft = centre * pps - view / 2;
}

interface ZoomControlsProps {
    rootRef: RefObject< HTMLElement | null >;
    scrollerRef: RefObject< HTMLElement | null >;
    duration: number;
}

export function ZoomControls( { rootRef, scrollerRef, duration }: ZoomControlsProps ) {
    const zoom = ( pick: ( pps: number, view: number ) => number ) => (): void => {
        const root = rootRef.current;
        const scroller = scrollerRef.current;
        if ( ! root || ! scroller ) return;
        applyPps( root, scroller, pick( currentPps( root ), scroller.clientWidth - GUTTER_PX ) );
    };
    return (
        <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-dim">zoom</span>
            <button type="button" className={ BUTTON } onClick={ zoom( ( p ) => p / ZOOM_STEP ) }>
                −
            </button>
            <button type="button" className={ BUTTON } onClick={ zoom( ( p ) => p * ZOOM_STEP ) }>
                +
            </button>
            <button type="button" className={ BUTTON } onClick={ zoom( ( _, view ) => view / duration ) }>
                fit
            </button>
        </div>
    );
}
