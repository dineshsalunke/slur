import { Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';

const port = Number( process.env.PORT ?? 2567 );

const gameServer = new Server( { transport: new WebSocketTransport() } );

// Rooms are registered in the implement phase, e.g.:
//   import { ROOM_NAME } from '@slur/shared';
//   gameServer.define( ROOM_NAME, RunRoom );

gameServer
    .listen( port )
    .then( () => {
        console.log( `[slur] server up on ws://localhost:${ port }` );
    } )
    .catch( ( err: unknown ) => {
        console.error( '[slur] server failed to start', err );
        process.exit( 1 );
    } );
