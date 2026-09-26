import { redirect, type ShouldRevalidateFunctionArgs } from 'react-router';
import { TrackEditor } from '../track-editor/track-editor';
import { editorSource, openEditor, savedTracks, saveEditorLevel } from '../track-editor/track-editor.state';
import type { Route } from './+types/route';

export function meta() {
    return [ { title: 'SLUR — Track Editor' } ];
}

export async function clientLoader( { request }: Route.ClientLoaderArgs ) {
    const [ level, saved ] = await Promise.all( [
        editorSource( new URL( request.url ).searchParams ),
        savedTracks(),
    ] );
    openEditor( level );
    return { saved };
}

export async function clientAction( { request }: Route.ClientActionArgs ) {
    const form = await request.formData();
    const result = await saveEditorLevel( String( form.get( 'name' ) ?? '' ) );
    return 'url' in result ? redirect( result.url ) : result;
}

export function shouldRevalidate( { currentUrl, nextUrl }: ShouldRevalidateFunctionArgs ) {
    return currentUrl.search !== nextUrl.search;
}

export default function TrackEditorRoute() {
    return <TrackEditor />;
}
