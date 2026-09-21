import os from 'node:os';
import { LobbyRoom, Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { ROOM_NAME } from '@slur/shared';
import { RunRoom } from './rooms/run-room.js';

const port = Number( process.env.PORT || 2567 );
const host = process.env.HOST ?? '0.0.0.0';

function lanAddress(): string {
    for ( const ifaces of Object.values( os.networkInterfaces() ) ) {
        for ( const i of ifaces ?? [] ) {
            if ( i.family === 'IPv4' && ! i.internal ) return i.address;
        }
    }
    return 'localhost';
}

const gameServer = new Server( { transport: new WebSocketTransport() } );

gameServer.define( ROOM_NAME, RunRoom ).enableRealtimeListing();
gameServer.define( 'lobby', LobbyRoom );

gameServer
    .listen( port, host )
    .then( () => {
        const ip = lanAddress();
        console.log( `[slur] server up on ws://${ ip }:${ port } (bound ${ host })` );
        console.log( `[slur] players join at → http://${ ip }:5173` );
    } )
    .catch( ( err: unknown ) => {
        console.error( '[slur] server failed to start', err );
        process.exit( 1 );
    } );
