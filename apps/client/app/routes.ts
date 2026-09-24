import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
    index( 'routes/home.tsx' ),
    route( 'test-level', 'routes/test-level/route.tsx' ),
    route( 'pacing', 'routes/pacing/route.tsx' ),
    route( 'game/:roomId', 'routes/game/route.tsx' ),
    ...( process.env.NODE_ENV === 'production'
        ? []
        : [ route( 'tapper', 'routes/tapper/route.tsx' ), route( 'song-lab', 'routes/song-lab/route.tsx' ) ] ),
] satisfies RouteConfig;
