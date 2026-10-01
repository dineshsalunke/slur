import { Fragment } from 'react';
import { Outlet, type ShouldRevalidateFunctionArgs } from 'react-router';
import { loadSfx } from '../../audio/sfx-map';
import type { Route } from './+types/route';
import { EditButton } from './edit-button/edit-button';
import { RecIndicator } from './flight-recorder/rec-indicator';
import { RecordKey } from './flight-recorder/record-key';
import { PickupGrantsMount } from './pickup-grants/pickup-grants-mount';
import { ResetKey } from './start-point/reset-key';
import { startOf } from './start-point/start-point.utils';
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
    const url = new URL( request.url );
    const descriptor = await testLevelDescriptorFor( url.searchParams );
    return {
        room: openTestLevelRoom( descriptor, startOf( url.search ) ),
        descriptor,
    };
}

export function shouldRevalidate( { currentUrl, nextUrl }: ShouldRevalidateFunctionArgs ) {
    return [ 'gen', 'seed', 'level', 'v' ].some(
        ( k ) => currentUrl.searchParams.get( k ) !== nextUrl.searchParams.get( k ),
    );
}

export default function TestLevel( { loaderData }: Route.ComponentProps ) {
    return (
        <Fragment>
            <TestLevelCanvas room={ loaderData.room } descriptor={ loaderData.descriptor } />
            <EditButton />
            <ResetKey room={ loaderData.room } />
            <RecordKey />
            <RecIndicator />
            <PickupGrantsMount room={ loaderData.room } />
            <Outlet />
        </Fragment>
    );
}
