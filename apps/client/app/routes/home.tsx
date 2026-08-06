import { SHARED_PACKAGE } from '@slur/shared';
import type { Route } from './+types/home';

export function meta( _args: Route.MetaArgs ) {
    return [ { title: 'SLUR' }, { name: 'description', content: 'LAN party ship-racer' } ];
}

export default function Home() {
    return (
        <main>
            <h1>SLUR</h1>
            <p>Project skeleton is up. Client wired to { SHARED_PACKAGE }.</p>
        </main>
    );
}
