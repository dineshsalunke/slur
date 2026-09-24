import type { ShipClassId } from '@slur/shared';
import { variantCheck } from './lab-check';
import { installLabKeys } from './lab-keys';
import { fetchBundle, listBundles } from './lab-source';
import { labView, pickEntry, pickVariant } from './lab-view';
import { loadReplay } from './replay-state';
import { SongLabEmpty } from './song-lab-empty';
import { SongLabPage } from './song-lab-page';
import { loadSong } from './song-sync';

const DEFAULT_CLASS: ShipClassId = 'freighter';

export function meta() {
    return [ { title: 'SLUR — Song Lab' } ];
}

export async function clientLoader( { request }: { request: Request } ) {
    installLabKeys();
    const q = new URL( request.url ).searchParams;
    const bundles = await listBundles();
    const name = bundles.find( ( b ) => b === q.get( 'bundle' ) ) ?? bundles[ 0 ];
    if ( ! name ) return null;
    const bundle = await fetchBundle( name );
    const variant = pickVariant( bundle, q.get( 'variant' ) );
    const check = variantCheck( name, bundle, variant );
    const picked = pickEntry( check.entries, q.get( 'class' ) ?? DEFAULT_CLASS, q.get( 'pilot' ) );
    const view = labView( bundles, name, bundle, variant, check.entries, picked, check );
    const clock = bundle.song.clock;
    loadReplay( view.classId, picked?.run, clock.z0 );
    void loadSong( bundle.song.file, clock );
    return { view, track: check.track };
}

export default function SongLab( { loaderData }: { loaderData: Awaited< ReturnType< typeof clientLoader > > } ) {
    if ( ! loaderData ) return <SongLabEmpty />;
    return <SongLabPage view={ loaderData.view } track={ loaderData.track } />;
}
