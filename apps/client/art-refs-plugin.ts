import { createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

/**
 * Serves the frozen concept boards to the isolation labs, in DEV ONLY.
 *
 * WHY A PLUGIN AND NOT THE OBVIOUS THING. The boards live in `docs/art-direction/boards/`, outside the client root,
 * and they are ~2 MB each (24 MB for the set). Five mechanisms were weighed:
 *
 *   1. Copy them into `apps/client/public/` — duplicates 24 MB of git-lfs payload into the app, and the copy
 *      silently drifts the moment a handoff vN+1 lands. Rejected.
 *   2. Symlink `public/art-refs` → the boards dir — depends on unverified symlink behaviour in both the dev
 *      static server and the build-time public-dir copy. Rejected as unpredictable.
 *   3. `server.fs.allow` + `/@fs/<absolute path>` URLs — bakes one machine's absolute path into source.
 *      Rejected.
 *   4. `import url from '../../docs/.../03.png'` (Vite's asset pipeline) — works in dev AND build, but that
 *      is the problem: it emits all 24 MB into the SHIPPED bundle for an instrument only ever used in dev.
 *      Rejected.
 *   5. THIS — a dev-only connect middleware that streams the file straight off disk. Zero copies, zero bytes
 *      in the production build, no absolute paths in source, and it reads the handoff package in place so it
 *      can never go stale. Chosen.
 *
 * `apply: 'serve'` means the production build never sees this plugin; the labs are dev instruments and their
 * reference overlay degrades to an on-screen hint in a built SPA (see `reference-overlay.tsx`).
 */
export function artRefsPlugin( { dir, route = '/art-refs' }: { dir: string; route?: string } ): Plugin {
    return {
        name: 'slur:art-refs',
        apply: 'serve',
        configureServer( server ) {
            // Connect strips the mount prefix, so `req.url` here is `/03_monoliths_final.png`.
            server.middlewares.use( route, ( req, res, next ) => {
                const name = ( req.url ?? '' ).replace( /^\//, '' ).split( '?' )[ 0 ];

                // Whitelist the shape rather than resolving-and-comparing paths: a board filename is always
                // `<digits>_<snake_case>.png`, which cannot express `..` or a separator. Traversal-proof by
                // construction, which is the only kind of proof worth having in a file server.
                if ( ! /^[a-z0-9_]+\.png$/i.test( name ) ) {
                    next();
                    return;
                }

                const file = join( dir, name );
                let size: number;
                try {
                    size = statSync( file ).size;
                } catch {
                    res.statusCode = 404;
                    res.end( `art-refs: no such board "${ name }" in ${ dir }` );
                    return;
                }

                // An unsmudged git-lfs pointer is a ~130-byte text file that would otherwise be served as a
                // "PNG" and decode to nothing — a known time-sink in this repo. Fail loudly with the fix.
                if ( size < 1024 ) {
                    res.statusCode = 409;
                    res.end( `art-refs: "${ name }" is an unsmudged git-lfs pointer (${ size }B). Run: git lfs pull` );
                    return;
                }

                res.setHeader( 'Content-Type', 'image/png' );
                res.setHeader( 'Content-Length', String( size ) );
                // The boards are frozen (ADR-008), so the browser should fetch each 2 MB file exactly once
                // per session no matter how often the overlay is toggled.
                res.setHeader( 'Cache-Control', 'public, max-age=3600, immutable' );
                createReadStream( file ).pipe( res );
            } );
        },
    };
}
