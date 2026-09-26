import { Fragment } from 'react';
import { Outlet, type ShouldRevalidateFunctionArgs } from 'react-router';
import { loadSfx } from '../../audio/sfx-map';
import type { Route } from './+types/route';
import { EditButton } from './edit-button/edit-button';
import { TestLevelCanvas } from './test-level-canvas/test-level-canvas';
import { openTestLevelRoom, testLevelDescriptorFor } from './test-level-room';

export function meta() {
    return [
        { title: 'SLUR — Test Level' },
        { name: 'description', content: 'Fixed flyable level on the in-process loopback room' },
    ];
}

export async function clientLoader( { request }: Route.ClientLoaderArgs ) {
    void loadSfx( 'pickup' );
    const descriptor = await testLevelDescriptorFor( new URL( request.url ).searchParams );
    return { room: openTestLevelRoom( descriptor ), descriptor };
}

export function shouldRevalidate( { currentUrl, nextUrl }: ShouldRevalidateFunctionArgs ) {
    return [ 'gen', 'level', 'v' ].some( ( k ) => currentUrl.searchParams.get( k ) !== nextUrl.searchParams.get( k ) );
}

export default function TestLevel( { loaderData }: Route.ComponentProps ) {
    return (
        <Fragment>
            <TestLevelCanvas room={ loaderData.room } descriptor={ loaderData.descriptor } />
            <EditButton />
            <Outlet />
        </Fragment>
    );
}
