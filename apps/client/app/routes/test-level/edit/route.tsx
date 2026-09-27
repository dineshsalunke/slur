import { redirect, type ShouldRevalidateFunctionArgs } from 'react-router';
import { stopTake } from '../flight-recorder/flight-recorder.state';
import { startOf, withStart } from '../start-point/start-point.utils';
import { editorSource, savedTracks } from '../track-editor/editor-tracks';
import { TrackEditor } from '../track-editor/track-editor';
import { deleteSavedTrack, openEditor, reloadSaved, saveEditorLevel } from '../track-editor/track-editor.state';
import type { Route } from './+types/route';

export function meta() {
    return [ { title: 'SLUR — Track Editor' } ];
}

export async function clientLoader( { request }: Route.ClientLoaderArgs ) {
    stopTake();
    const url = new URL( request.url );
    const [ level, saved ] = await Promise.all( [ editorSource( url.searchParams ), savedTracks() ] );
    openEditor( level, startOf( url.search ), saved );
    return null;
}

export async function clientAction( { request }: Route.ClientActionArgs ) {
    const form = await request.formData();
    const url = new URL( request.url );
    if ( form.get( 'intent' ) === 'delete' ) {
        const id = String( form.get( 'id' ) ?? '' );
        const result = await deleteSavedTrack( id );
        if ( 'error' in result ) return result;
        if ( url.searchParams.get( 'level' ) === id ) return redirect( '/test-level/edit' );
        await reloadSaved();
        return result;
    }
    const result = await saveEditorLevel( String( form.get( 'name' ) ?? '' ) );
    if ( ! ( 'url' in result ) ) return result;
    const [ path, search = '' ] = result.url.split( '?' );
    return redirect( `${ path }${ withStart( search, startOf( url.search ) ) }` );
}

export function shouldRevalidate( { currentUrl, nextUrl }: ShouldRevalidateFunctionArgs ) {
    return withStart( currentUrl.search, null ) !== withStart( nextUrl.search, null );
}

export default function TrackEditorRoute() {
    return <TrackEditor />;
}
