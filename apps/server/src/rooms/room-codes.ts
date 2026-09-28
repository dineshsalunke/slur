import { randomInt } from 'node:crypto';
import { makeRoomCode } from '@slur/shared';

export class RoomCodes {
    private readonly live = new Set< string >();
    private publicCode: string | null = null;

    constructor( private readonly randomIndex: ( size: number ) => number = ( size ) => randomInt( size ) ) {}

    claim(): string {
        let code = makeRoomCode( this.randomIndex );
        while ( this.live.has( code ) ) code = makeRoomCode( this.randomIndex );
        this.live.add( code );
        return code;
    }

    claimPublic( code: string ): boolean {
        if ( this.publicCode !== null ) return false;
        this.publicCode = code;
        return true;
    }

    release( code: string ): void {
        this.live.delete( code );
        if ( this.publicCode === code ) this.publicCode = null;
    }

    publicRoom(): string | null {
        return this.publicCode;
    }
}

export const roomCodes = new RoomCodes();
