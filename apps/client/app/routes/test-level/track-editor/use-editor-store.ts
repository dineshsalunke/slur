import { useSyncExternalStore } from 'react';
import { type EditorState, editorState, subscribeEditor } from './track-editor.state';

export function useEditorStore< T >( select: ( s: Readonly< EditorState > ) => T ): T {
    const read = () => select( editorState() );
    return useSyncExternalStore( subscribeEditor, read, read );
}
