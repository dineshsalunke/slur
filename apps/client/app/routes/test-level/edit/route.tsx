import { redirect, type ShouldRevalidateFunctionArgs } from 'react-router';
import { startOf, withStart } from '../start-point/start-point.utils';
import { TrackEditor } from '../track-editor/track-editor';
import { editorSource, openEditor, savedTracks, saveEditorLevel } from '../track-editor/track-editor.state';
import type { Route } from './+types/route';

export function meta() {
    return [ { title: 'SLUR — Track Editor' } ];
}

export async function clientLoader( { request }: Route.ClientLoaderArgs ) {
    const url = new URL( request.url );
    const [ level, saved ] = await Promise.all( [ editorSource( url.searchParams ), savedTracks() ] );
    openEditor( level, startOf( url.search ) );
    return { saved };
}

export async function clientAction( { request }: Route.ClientActionArgs ) {
    const form = await request.formData();
    const result = await saveEditorLevel( String( form.get( 'name' ) ?? '' ) );
    if ( ! ( 'url' in result ) ) return result;
    const [ path, search = '' ] = result.url.split( '?' );
    return redirect( `${ path }${ withStart( search, startOf( new URL( request.url ).search ) ) }` );
}

export function shouldRevalidate( { currentUrl, nextUrl }: ShouldRevalidateFunctionArgs ) {
    return withStart( currentUrl.search, null ) !== withStart( nextUrl.search, null );
}

export default function TrackEditorRoute() {
    return <TrackEditor />;
}
