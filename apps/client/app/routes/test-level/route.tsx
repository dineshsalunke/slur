import { DEFAULT_TRACK_GEN, isTrackGen } from '@slur/shared';
import type { ShouldRevalidateFunctionArgs } from 'react-router';
import { loadSfx } from '../../audio/sfx-map';
import type { Route } from './+types/route';
import { TestLevelCanvas } from './test-level-canvas/test-level-canvas';
import { testLevelDescriptor } from './test-level-canvas/test-level-canvas.utils';
import { openTestLevelRoom } from './test-level-room';

export function meta() {
    return [
        { title: 'SLUR — Test Level' },
        { name: 'description', content: 'Fixed flyable level on the in-process loopback room' },
    ];
}

export function clientLoader( { request }: Route.ClientLoaderArgs ) {
    void loadSfx( 'pickup' );
    const param = new URL( request.url ).searchParams.get( 'gen' );
    const gen = isTrackGen( param ) ? param : DEFAULT_TRACK_GEN;
    return { room: openTestLevelRoom( gen ), descriptor: testLevelDescriptor( gen ) };
}

export function shouldRevalidate( { currentUrl, nextUrl }: ShouldRevalidateFunctionArgs ) {
    return currentUrl.searchParams.get( 'gen' ) !== nextUrl.searchParams.get( 'gen' );
}

export default function TestLevel( { loaderData }: Route.ComponentProps ) {
    return <TestLevelCanvas room={ loaderData.room } descriptor={ loaderData.descriptor } />;
}
