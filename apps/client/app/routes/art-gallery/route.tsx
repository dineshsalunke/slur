import { ArtGalleryCanvas } from './art-gallery-canvas';
import { ArtGallerySidebar } from './art-gallery-sidebar';

export function meta() {
    return [ { title: 'SLUR — Art Gallery' } ];
}

/**
 * `/art-gallery` — every piece of gameplay art, isolated, at true scale, under the game's own bloom.
 *
 * The companion to `/art-lab`: the lab answers "how does it read at speed", the gallery answers "what is
 * this thing actually". Both consume the SAME materials (`game/scene/track-materials.ts`), which is what
 * stops a gallery from quietly drifting away from the game it claims to document — the usual failure of
 * an asset viewer.
 *
 * No Storybook: these are R3F components that need a Canvas and the real post stack to be judged at all,
 * so a route is both cheaper and more faithful than an isolated-component harness would be.
 */
export default function ArtGalleryRoute() {
    return (
        <main>
            <ArtGallerySidebar />
            <ArtGalleryCanvas />
        </main>
    );
}
