import { SEG_LEN, type Track as TrackHandle } from '@slur/shared';
import type { World } from 'koota';
import type { useRoom } from '../../net/room-context/use-room';
import { LocalPlayer, Net, Sim } from '../ecs/traits';
import { KIND } from './net-debug-hud.constants';

type Room = ReturnType< typeof useRoom >;

export function playerLines( room: Room ): string[] {
    const lines: string[] = [];
    room.state.players.forEach( ( p, sid ) => {
        const me = sid === room.sessionId ? '★' : ' ';
        lines.push(
            `${ me } ${ sid.slice( 0, 4 ) }  x=${ p.x.toFixed( 1 ) } z=${ p.z.toFixed( 1 ) } st=${ p.stunTimer.toFixed( 1 ) } pw=${ Array.from( p.slots ).join( '' ) }${ p.connected ? '' : ' (gone)' }`,
        );
    } );
    return lines;
}

export function localShipLines( world: World, track: TrackHandle ): string[] {
    const e = world.queryFirst( LocalPlayer, Sim );
    const s = e?.get( Sim );
    if ( ! s ) return [];
    const seg = track.segmentAtZ( s.z );
    const ahead = [ 1, 2, 3, 4, 5, 6 ]
        .map( ( n ) => KIND[ track.segmentAtZ( s.z + n * SEG_LEN ).kind ] ?? '?' )
        .join( ' ' );
    return [
        `ship: ${ e?.get( Net )?.shipId ?? '?' }  (keys 1-5 to swap)`,
        `me y=${ s.y.toFixed( 2 ) } z=${ s.z.toFixed( 0 ) } grnd=${ s.grounded ? 1 : 0 } dead=${ s.dead ? 1 : 0 }`,
        `over: seg${ seg.index } ${ seg.kind } floors=${ seg.floors.length }`,
        `ahead: ${ ahead }`,
    ];
}
