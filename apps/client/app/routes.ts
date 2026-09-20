import { index, type RouteConfig, route } from '@react-router/dev/routes';

// Route modules live in app/routes/<name>/ (colocated components/ + utils/) as the app grows.
// S4 flow: `/` landing (name + live room list + host) → `/game/:roomId` (one persistent Canvas; lobby /
// countdown / race / results are PHASE-driven overlays, NOT routes — navigating would remount the Canvas).
export default [
    index( 'routes/home.tsx' ),
    route( 'env-lab', 'routes/env-lab/route.tsx' ), // throwaway atmosphere lab (S6 art pass) — keys 1/2/3
    route( 'art-lab', 'routes/art-lab/route.tsx' ), // art review instrument — REAL track/camera/collision, no server
    route( 'art-gallery', 'routes/art-gallery/route.tsx' ), // every art subject isolated at TRUE scale, same bloom
    // `/iso-*` — ingredient isolation labs. Adding one is TWO steps: a `routes/iso-<thing>/route.tsx` that
    // renders `<IsoLab>`, and one line here. Nothing in `app/iso-lab/` changes. See `app/iso-lab/iso-lab.tsx`.
    route( 'iso-monolith', 'routes/iso-monolith/route.tsx' ), // exemplar — PLACEHOLDER subject, real instrument
    route( 'iso-sky', 'routes/iso-sky/route.tsx' ), // art-pass task 1 — procedural deep-space sky + roughness probes
    route( 'iso-block', 'routes/iso-block/route.tsx' ), // art-pass task 7 — the sealed deadly block, three legal footprints
    route( 'iso-block-wear', 'routes/iso-block-wear/route.tsx' ), // the same block, wear strength swept 0 → 1
    route( 'game/:roomId', 'routes/game/route.tsx' ),
] satisfies RouteConfig;
