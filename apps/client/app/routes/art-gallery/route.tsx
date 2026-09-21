import { ArtGalleryCanvas } from './art-gallery-canvas';
import { ArtGallerySidebar } from './art-gallery-sidebar';

export function meta() {
    return [ { title: 'SLUR — Art Gallery' } ];
}

export default function ArtGalleryRoute() {
    return (
        <main>
            <ArtGallerySidebar />
            <ArtGalleryCanvas />
        </main>
    );
}
