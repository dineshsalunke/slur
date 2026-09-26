import type { MouseEvent, PointerEvent } from 'react';

export const lift = ( e: PointerEvent< HTMLButtonElement > ) => {
    delete e.currentTarget.dataset.on;
};
export const noMenu = ( e: MouseEvent ) => e.preventDefault();
