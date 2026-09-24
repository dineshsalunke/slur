import { variantCheck } from './lab-check';
import { installLabKeys } from './lab-keys';
import { fetchBundle, listBundles } from './lab-source';
import { labView, pickClass, pickVariant } from './lab-view';
import { loadReplay } from './replay-state';
import { SongLabEmpty } from './song-lab-empty';
import { SongLabPage } from './song-lab-page';

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
    const classId = pickClass( variant, q.get( 'class' ) );
    const check = variantCheck( name, bundle, variant );
    loadReplay(
        classId,
        variant.runs.find( ( r ) => r.classId === classId ),
    );
    return { view: labView( bundles, name, bundle, variant, classId, check ), track: check.track };
}

export default function SongLab( { loaderData }: { loaderData: Awaited< ReturnType< typeof clientLoader > > } ) {
    if ( ! loaderData ) return <SongLabEmpty />;
    return <SongLabPage view={ loaderData.view } track={ loaderData.track } />;
}
