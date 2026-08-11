import os from 'node:os';
import { LobbyRoom, Server } from '@colyseus/core';
import { WebSocketTransport } from '@colyseus/ws-transport';
import { ROOM_NAME } from '@slur/shared';
import { RunRoom } from './rooms/run-room.js';

// `||` (not `??`): an empty `PORT=` is `""`, which `??` would keep → `Number("")` = 0 → a random OS port.
// No port has a legitimate falsy value, so `||` is strictly safe. Matches the client fix in #69. (#74)
const port = Number( process.env.PORT || 2567 );
// Bind ALL interfaces (not just loopback) so LAN peers can connect — the office-play requirement.
// Override with HOST if ever needed. The client derives the ws host from window.location.hostname
// (net/client.ts), so a peer hitting http://<host-ip>:5173 auto-targets ws://<host-ip>:2567.
const host = process.env.HOST ?? '0.0.0.0';

// First non-internal IPv4 = the address to hand other machines.
function lanAddress(): string {
    for ( const ifaces of Object.values( os.networkInterfaces() ) ) {
        for ( const i of ifaces ?? [] ) {
            if ( i.family === 'IPv4' && ! i.internal ) return i.address;
        }
    }
    return 'localhost';
}

const gameServer = new Server( { transport: new WebSocketTransport() } );

// enableRealtimeListing() is REQUIRED for the LobbyRoom to see this room: it registers the create / join /
// leave / metadata-change / dispose → updateLobby hooks (they live INSIDE that call — off by default). Without
// it the room never appears in the live list nor pushes phase/host updates. Verified against @colyseus/core.
gameServer.define( ROOM_NAME, RunRoom ).enableRealtimeListing();
// Built-in live room list. Clients join 'lobby' and receive `rooms` (snapshot) + `+`/`-` deltas; each run
// room's { hostName, phase } metadata rides along on IRoomCache.metadata. No custom HTTP route needed.
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
