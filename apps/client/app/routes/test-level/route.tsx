import { DEFAULT_TRACK_GEN, isTrackGen } from '@slur/shared';
import { loadSfx } from '../../audio/sfx-map';
import type { Route } from './+types/route';
import { TestLevelCanvas } from './test-level-canvas/test-level-canvas';

export function meta() {
    return [
        { title: 'SLUR — Test Level' },
        { name: 'description', content: 'Fixed flyable level for art work (no netcode)' },
    ];
}

export function clientLoader( { request }: Route.ClientLoaderArgs ) {
    void loadSfx( 'pickup' );
    const gen = new URL( request.url ).searchParams.get( 'gen' );
    return { gen: isTrackGen( gen ) ? gen : DEFAULT_TRACK_GEN };
}

export default function TestLevel( { loaderData }: Route.ComponentProps ) {
    return <TestLevelCanvas gen={ loaderData.gen } />;
}
