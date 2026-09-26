import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useMatch } from 'react-router';

export function PauseWhileEditing() {
    const setFrameloop = useThree( ( s ) => s.setFrameloop );
    const editing = useMatch( '/test-level/edit' ) !== null;

    // Syncs R3F's frameloop store with the router: the scene stops rendering while the editor overlay is open.
    useEffect( () => {
        setFrameloop( editing ? 'never' : 'always' );
    }, [ editing, setFrameloop ] );

    return null;
}
