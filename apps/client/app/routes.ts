import { index, type RouteConfig, route } from '@react-router/dev/routes';

export default [
    index( 'routes/home.tsx' ),
    route( 'env-lab', 'routes/env-lab/route.tsx' ),
    route( 'art-lab', 'routes/art-lab/route.tsx' ),
    route( 'art-gallery', 'routes/art-gallery/route.tsx' ),
    route( 'iso-monolith', 'routes/iso-monolith/route.tsx' ),
    route( 'iso-sky', 'routes/iso-sky/route.tsx' ),
    route( 'iso-block', 'routes/iso-block/route.tsx' ),
    route( 'iso-block-wear', 'routes/iso-block-wear/route.tsx' ),
    route( 'game/:roomId', 'routes/game/route.tsx' ),
] satisfies RouteConfig;
