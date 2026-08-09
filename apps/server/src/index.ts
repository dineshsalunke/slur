import { LobbyRoom, Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { ROOM_NAME } from '@slur/shared';
import { RunRoom } from './rooms/run-room.js';

const port = Number( process.env.PORT ?? 2567 );

const gameServer = new Server( { transport: new WebSocketTransport() } );

// enableRealtimeListing() is REQUIRED for the LobbyRoom to see this room: it registers the create / join /
// leave / metadata-change / dispose → updateLobby hooks (they live INSIDE that call — off by default). Without
// it the room never appears in the live list nor pushes phase/host updates. Verified against @colyseus/core.
gameServer.define( ROOM_NAME, RunRoom ).enableRealtimeListing();
// Built-in live room list. Clients join 'lobby' and receive `rooms` (snapshot) + `+`/`-` deltas; each run
// room's { hostName, phase } metadata rides along on IRoomCache.metadata. No custom HTTP route needed.
gameServer.define( 'lobby', LobbyRoom );

gameServer
    .listen( port )
    .then( () => {
        console.log( `[slur] server up on ws://localhost:${ port }` );
    } )
    .catch( ( err: unknown ) => {
        console.error( '[slur] server failed to start', err );
        process.exit( 1 );
    } );
