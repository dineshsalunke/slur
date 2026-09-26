import type { Route } from './+types/route';
import { analyzeSeed } from './analyze-client';
import { PacingBoard } from './pacing-board/pacing-board';
import { PacingReportContext } from './pacing-report-context';
import { parseSeed } from './route.utils';

export function meta() {
    return [
        { title: 'SLUR — Pacing' },
        { name: 'description', content: 'Pacing board: a seeded track and its demand on one time axis' },
    ];
}

export async function clientLoader( { request }: Route.ClientLoaderArgs ) {
    const seed = parseSeed( new URL( request.url ).searchParams.get( 'seed' ) );
    return { seed, report: await analyzeSeed( seed ) };
}

export default function Pacing( { loaderData }: Route.ComponentProps ) {
    return (
        <PacingReportContext value={ loaderData.report }>
            <PacingBoard seed={ loaderData.seed } />
        </PacingReportContext>
    );
}
