import { useTexture } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { BACKDROP_URL } from './scene-backdrop.constants';
import { coverFit, prepareBackdrop } from './scene-backdrop.utils';

export function SceneBackdrop() {
    const aspect = useThree( ( state ) => state.size.width / state.size.height );
    const map = useTexture( BACKDROP_URL );

    prepareBackdrop( map );
    coverFit( map, aspect );

    return <primitive attach="background" object={ map } />;
}
