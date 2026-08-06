import { index, type RouteConfig } from '@react-router/dev/routes';

// Route modules live in app/routes/<name>/ (colocated components/ + utils/) as the app grows.
// For the skeleton, a single index route.
export default [ index( 'routes/home.tsx' ) ] satisfies RouteConfig;
