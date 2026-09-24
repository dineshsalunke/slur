import { useLoaderData } from 'react-router';
import type { SongAnalysis } from '../../../tapper/beat-analysis';
import { installTapperKeys } from './tapper-keys';
import { TapperPage } from './tapper-page';

export function meta() {
    return [ { title: 'SLUR — Tapper' } ];
}

export async function clientLoader() {
    installTapperKeys();
    const all = ( await ( await fetch( '/__tapper/songs' ) ).json() ) as Partial< SongAnalysis >[];
    return {
        songs: all.filter( ( s ): s is SongAnalysis => Array.isArray( s.beats ) ),
        missing: all.filter( ( s ) => ! Array.isArray( s.beats ) ).map( ( s ) => s.song ?? '?' ),
    };
}

export default function Tapper() {
    const { songs, missing } = useLoaderData< typeof clientLoader >();
    return <TapperPage songs={ songs } missing={ missing } />;
}
