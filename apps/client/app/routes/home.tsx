import { Link } from 'react-router';
import type { Route } from './+types/home';

export function meta( _args: Route.MetaArgs ) {
    return [ { title: 'SLUR' }, { name: 'description', content: 'LAN party ship-racer' } ];
}

export default function Home() {
    return (
        <main>
            <h1>SLUR</h1>
            <p>
                <Link to="/solo">Fly solo →</Link>
            </p>
            <p>
                <Link to="/run">Fly online →</Link>
            </p>
        </main>
    );
}
