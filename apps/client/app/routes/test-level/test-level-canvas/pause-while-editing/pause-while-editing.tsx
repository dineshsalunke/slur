import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useMatch } from 'react-router';
import { editorOpen } from './pause-while-editing.state';

export function PauseWhileEditing() {
    const setFrameloop = useThree( ( s ) => s.setFrameloop );
    const editing = useMatch( '/test-level/edit' ) !== null;

    // Syncs R3F's frameloop store and the loopback run with the router: scene and sim stop while the editor is open.
    useEffect( () => {
        editorOpen.on = editing;
        setFrameloop( editing ? 'never' : 'always' );
    }, [ editing, setFrameloop ] );

    return null;
}
