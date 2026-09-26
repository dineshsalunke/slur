import type { RefObject } from 'react';
import { ZOOM_STEP } from '../board-scale';
import { BUTTON, GUTTER_PX } from './zoom-controls.constants';
import { applyPps, currentPps } from './zoom-controls.utils';

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
