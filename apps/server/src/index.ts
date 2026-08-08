import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { ROOM_NAME } from '@slur/shared';
import { RunRoom } from './rooms/run-room.js';

const port = Number( process.env.PORT ?? 2567 );

const gameServer = new Server( { transport: new WebSocketTransport() } );

gameServer.define( ROOM_NAME, RunRoom );

gameServer
    .listen( port )
    .then( () => {
        console.log( `[slur] server up on ws://localhost:${ port }` );
    } )
    .catch( ( err: unknown ) => {
        console.error( '[slur] server failed to start', err );
        process.exit( 1 );
    } );
