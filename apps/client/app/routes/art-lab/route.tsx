import { WorldProvider } from 'koota/react';
import { world } from '../../game/ecs/world';
import { ArtLabShell } from './art-lab-shell';

export function meta() {
    return [ { title: 'SLUR — Art Lab' } ];
}

export default function ArtLabRoute() {
    return (
        <WorldProvider world={ world }>
            <ArtLabShell />
        </WorldProvider>
    );
}
