import { matchMaker } from '@colyseus/core';
import { PHASE, ROOM_NAME, type RunState } from '@slur/shared';
import { RunRoom } from './rooms/run-room.js';

export interface RoomSnapshot {
    phase: number;
    racers: number;
    spectators: number;
}

export function snapshotOf( state: RunState ): RoomSnapshot {
    let racers = 0;
    let spectators = 0;
    for ( const player of state.players.values() ) {
        if ( player.spectating ) spectators++;
        else racers++;
    }
    return { phase: state.phase, racers, spectators };
}

export async function collectRooms(): Promise< RoomSnapshot[] > {
    const cached = await matchMaker.query( { name: ROOM_NAME } );
    const rooms: RoomSnapshot[] = [];
    for ( const entry of cached ) {
        const room = matchMaker.getLocalRoomById( entry.roomId );
        if ( room instanceof RunRoom ) rooms.push( snapshotOf( room.state ) );
    }
    return rooms;
}

function gauge( name: string, help: string, samples: [ string, number ][] ): string[] {
    return [
        `# HELP ${ name } ${ help }`,
        `# TYPE ${ name } gauge`,
        ...samples.map( ( [ labels, value ] ) => `${ name }${ labels } ${ value }` ),
    ];
}

export function formatMetrics( rooms: RoomSnapshot[], connections: number, uptimeSeconds: number ): string {
    const byPhase = Object.entries( PHASE ).map( ( [ label, phase ] ): [ string, number ] => [
        `{phase="${ label }"}`,
        rooms.filter( ( r ) => r.phase === phase ).length,
    ] );
    const racers = rooms.reduce( ( sum, r ) => sum + r.racers, 0 );
    const spectators = rooms.reduce( ( sum, r ) => sum + r.spectators, 0 );
    return `${ [
        ...gauge( 'slur_rooms', 'Race rooms by phase.', byPhase ),
        ...gauge( 'slur_players', 'Players seated in race rooms, by role.', [
            [ '{role="racer"}', racers ],
            [ '{role="spectator"}', spectators ],
        ] ),
        ...gauge( 'slur_connections', 'Open client connections, lobby listings included.', [ [ '', connections ] ] ),
        ...gauge( 'slur_uptime_seconds', 'Seconds since the server process started.', [
            [ '', Math.floor( uptimeSeconds ) ],
        ] ),
    ].join( '\n' ) }\n`;
}

export async function renderMetrics(): Promise< string > {
    return formatMetrics( await collectRooms(), matchMaker.stats.local.ccu, process.uptime() );
}
