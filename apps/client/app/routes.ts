import { index, type RouteConfig, route } from '@react-router/dev/routes';

const devRoutes = [
    route( 'test-level', 'routes/test-level/route.tsx' ),
    route( 'pacing', 'routes/pacing/route.tsx' ),
    route( 'beat-deck', 'routes/beat-deck/route.tsx' ),
];

export default [
    index( 'routes/home.tsx' ),
    route( 'game/:roomId', 'routes/game/route.tsx' ),
    ...( process.env.NODE_ENV === 'production' ? [] : devRoutes ),
] satisfies RouteConfig;
