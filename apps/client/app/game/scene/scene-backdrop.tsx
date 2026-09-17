import { useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Placeholder deep-space backdrop.
 *
 * STATUS: temporary. `art-handoff-v2` §4 calls for "a rich desaturated deep-space/nebula backdrop,
 * planetary rim light, layered distant debris" — this is a single flat image standing in until the
 * procedural celestial layer (ADD §9) exists. It is deliberately the ONLY bitmap in the track pipeline.
 *
 * MECHANISM — `attach="background"` sets `scene.background` declaratively, so R3F owns the lifetime and
 * clears it on unmount. Rejected: a `useEffect` writing `scene.background` by hand (an Effect with no
 * external system to synchronise — R3F already exposes attachment as a prop), and a camera-locked billboard
 * plane (more geometry and a second thing to keep in front of the far plane, for no gain while the image
 * is static).
 *
 * A flat texture as `scene.background` fills the viewport and does NOT parallax with the camera. For an
 * infinitely-distant nebula that reads correctly — but it also means this cannot convey depth on its own.
 * Depth is the job of the asteroid/monolith layers in front of it.
 */
export function SceneBackdrop( { url = '/textures/nebula-backdrop.jpg' }: { url?: string } ) {
    const tex = useTexture( url );
    // The source is an sRGB photo-style image; without this it renders washed out under the renderer's
    // linear workflow.
    tex.colorSpace = THREE.SRGBColorSpace;
    return <primitive attach="background" object={ tex } />;
}
