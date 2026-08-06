import { index, type RouteConfig, route } from '@react-router/dev/routes';

// Route modules live in app/routes/<name>/ (colocated components/ + utils/) as the app grows.
export default [ index( 'routes/home.tsx' ), route( 'solo', 'routes/solo/route.tsx' ) ] satisfies RouteConfig;
