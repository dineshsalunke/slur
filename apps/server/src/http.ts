import { resolve } from 'node:path';
import express, { type Application } from 'express';
import { renderMetrics } from './metrics.js';

export function mountHttp( app: Application, clientDir: string | undefined ): void {
    app.get( '/healthz', ( _req, res ) => {
        res.status( 200 ).type( 'text/plain' ).send( 'ok' );
    } );

    app.get( '/metrics', async ( _req, res ) => {
        res.setHeader( 'Cache-Control', 'no-store' );
        res.type( 'text/plain; version=0.0.4' ).send( await renderMetrics() );
    } );

    if ( ! clientDir ) return;

    const root = resolve( clientDir );
    const indexHtml = resolve( root, 'index.html' );

    app.use(
        '/assets',
        express.static( resolve( root, 'assets' ), { immutable: true, maxAge: '1y', fallthrough: false } ),
    );
    app.use( express.static( root, { index: false } ) );
    app.use( ( req, res, next ) => {
        if ( req.method !== 'GET' && req.method !== 'HEAD' ) return next();
        res.setHeader( 'Cache-Control', 'no-cache' );
        res.sendFile( indexHtml );
    } );
}
