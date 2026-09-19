import { Canvas } from '@react-three/fiber';
import { FrameTap } from '../../dev/frame-tap';
import { GalleryBloom } from './gallery-bloom';
import { GalleryCamera } from './gallery-camera';
import { GalleryGrid } from './gallery-grid';
import { GallerySubject } from './gallery-subject';
import { SUBJECTS, slotFor } from './subjects';

/**
 * The gallery's WebGL half: every subject laid out on a world-space grid under ONE camera and ONE
 * EffectComposer.
 *
 * WHY NOT drei `<View>`: `View` is the purpose-built multi-viewport primitive and it IS available in the
 * installed drei (10.7.8). It was rejected deliberately — it renders each viewport through scissor into a
 * separate DOM rect, which does not coexist with a single global `EffectComposer` pass. Matching the game's
 * post-processing EXACTLY is the whole value of this route; a gallery lit differently from the game cannot
 * settle an art question. A shared world-space grid keeps one bloom pass over everything, at the cost of a
 * shared perspective — which is an acceptable trade, and arguably useful, since off-axis subjects are seen
 * at the same kind of angles they appear at in play.
 */
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

            { /* No OrbitControls: it and GalleryCamera would both drive the camera every frame and fight.
                 Framing is driven from the sidebar instead — click a subject to fly to it, "wide" to pull
                 back. Deterministic framing is also what makes two screenshots comparable, which free-orbit
                 inspection is not. */ }

            <GalleryBloom />
            { /* Lets this route be photographed from a tab nobody is looking at. Never mounted on /game — it
                 advances the sim. See app/dev/frame-tap.tsx. The DEV gate is what keeps it OUT of the
                 production bundle, not merely inert in it. */ }
            { import.meta.env.DEV && <FrameTap /> }
        </Canvas>
    );
}
