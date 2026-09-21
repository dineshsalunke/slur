import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
    index( 'routes/home.tsx' ),
    route( 'env-lab', 'routes/env-lab/route.tsx' ),
    route( 'test-level', 'routes/test-level/route.tsx' ),
    route( 'game/:roomId', 'routes/game/route.tsx' ),
] satisfies RouteConfig;
