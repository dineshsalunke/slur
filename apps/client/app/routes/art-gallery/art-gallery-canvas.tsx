import { Canvas } from '@react-three/fiber';
import { FrameTap } from '../../dev/frame-tap';
import { GalleryBloom } from './gallery-bloom';
import { GalleryCamera } from './gallery-camera';
import { GalleryGrid } from './gallery-grid';
import { GallerySubject } from './gallery-subject';
import { SUBJECTS, slotFor } from './subjects';

export function ArtGalleryCanvas() {
    return (
        <Canvas style={ { position: 'fixed', inset: 0 } } camera={ { fov: 50, position: [ 0, 60, -130 ] } }>
            <color attach="background" args={ [ '#05060a' ] } />
            <ambientLight intensity={ 0.5 } />
            <directionalLight position={ [ 30, 60, -40 ] } intensity={ 0.8 } />

            <GalleryCamera />

            { SUBJECTS.map( ( s, i ) => (
                <GallerySubject key={ s.id } subject={ s } position={ slotFor( i ) } />
            ) ) }

            <GalleryGrid />

            <GalleryBloom />
            { import.meta.env.DEV && <FrameTap /> }
        </Canvas>
    );
}
