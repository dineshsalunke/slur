import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { RoomProvider } from '../../net/room-context/room-context';
import { Overlays } from './overlays';
import { room } from './test-room';

let root: Root | undefined;
let host: HTMLDivElement | undefined;

export async function mountOverlays(): Promise< HTMLDivElement > {
    ( globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean } ).IS_REACT_ACT_ENVIRONMENT = true;
    const container = document.createElement( 'div' );
    document.body.append( container );
    const created = createRoot( container );
    host = container;
    root = created;
    const router = createMemoryRouter( [
        {
            path: '/',
            element: (
                <RoomProvider room={ room }>
                    <Overlays />
                </RoomProvider>
            ),
        },
    ] );
    await act( async () => {
        created.render( <RouterProvider router={ router } /> );
    } );
    return container;
}

export async function unmountOverlays() {
    const mounted = root;
    if ( mounted ) {
        await act( async () => {
            mounted.unmount();
        } );
    }
    host?.remove();
    root = undefined;
    host = undefined;
}

export function pressEnter() {
    return act( async () => {
        document.body.dispatchEvent( new KeyboardEvent( 'keydown', { code: 'Enter', bubbles: true } ) );
    } );
}
