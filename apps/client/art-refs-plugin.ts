import { createReadStream, statSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

export function artRefsPlugin( { dir, route = '/art-refs' }: { dir: string; route?: string } ): Plugin {
    return {
        name: 'slur:art-refs',
        apply: 'serve',
        configureServer( server ) {
            server.middlewares.use( route, ( req, res, next ) => {
                const name = ( req.url ?? '' ).replace( /^\//, '' ).split( '?' )[ 0 ];

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

                if ( size < 1024 ) {
                    res.statusCode = 409;
                    res.end( `art-refs: "${ name }" is an unsmudged git-lfs pointer (${ size }B). Run: git lfs pull` );
                    return;
                }

                res.setHeader( 'Content-Type', 'image/png' );
                res.setHeader( 'Content-Length', String( size ) );
                res.setHeader( 'Cache-Control', 'public, max-age=3600, immutable' );
                createReadStream( file ).pipe( res );
            } );
        },
    };
}
