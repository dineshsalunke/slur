import { analyzeDescriptor, procgenDescriptor } from '@slur/shared';
import type { Route } from './+types/route';
import { PacingBoard } from './pacing-board';

const DEFAULT_SEED = 20260921;

function parseSeed( raw: string | null ): number {
    if ( raw === null || raw.trim() === '' ) return DEFAULT_SEED;
    const n = Number( raw );
    return Number.isSafeInteger( n ) ? n : DEFAULT_SEED;
}

export function meta() {
    return [
        { title: 'SLUR — Pacing' },
        { name: 'description', content: 'Pacing board: a seeded track and its demand on one time axis' },
    ];
}

export function clientLoader( { request }: Route.ClientLoaderArgs ) {
    const seed = parseSeed( new URL( request.url ).searchParams.get( 'seed' ) );
    return { seed, report: analyzeDescriptor( procgenDescriptor( seed ) ) };
}

export default function Pacing( { loaderData }: Route.ComponentProps ) {
    return <PacingBoard seed={ loaderData.seed } report={ loaderData.report } />;
}
