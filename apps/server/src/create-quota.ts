import { ServerError } from '@colyseus/core';
import { CREATE_LIMIT_CODE, ROOM_NAME, SERVER_FULL_CODE } from '@slur/shared';
import {
    CREATE_WINDOW_MS,
    MAX_CREATES_PER_WINDOW,
    MAX_LIVE_ROOMS_PER_IP,
    MAX_ROOMS,
    QUOTA_SWEEP_SIZE,
    SEAT_RESERVATION_SECONDS,
} from './limits.js';
import type { MatchmakeCall, MatchmakeGate } from './matchmake-guard.js';
import { roomCodes } from './rooms/room-codes.js';

const UNOWNED = '';
const PENDING_MS = SEAT_RESERVATION_SECONDS * 1000;

export class CreateQuota implements MatchmakeGate {
    private readonly owners = new Map< string, string >();
    private readonly creates = new Map< string, number[] >();
    private readonly pending = new Map< string, number[] >();

    constructor( private readonly joinsExisting: ( call: MatchmakeCall ) => boolean = () => false ) {}

    admit( call: MatchmakeCall, nowMs: number ): void {
        if ( ! this.isCreate( call ) ) return;
        if ( this.full() ) throw new ServerError( SERVER_FULL_CODE, 'The server is full' );
        const creates = this.recent( this.creates, call.ip, nowMs, CREATE_WINDOW_MS );
        if ( creates.length >= MAX_CREATES_PER_WINDOW || this.liveFor( call.ip, nowMs ) >= MAX_LIVE_ROOMS_PER_IP ) {
            throw new ServerError( CREATE_LIMIT_CODE, 'Too many rooms from one address' );
        }
        if ( this.creates.size >= QUOTA_SWEEP_SIZE ) this.sweep( nowMs );
        this.creates.set( call.ip, [ ...creates, nowMs ] );
        this.pending.set( call.ip, [ ...this.recent( this.pending, call.ip, nowMs, PENDING_MS ), nowMs ] );
    }

    full(): boolean {
        return this.owners.size >= MAX_ROOMS;
    }

    opened( roomId: string ): void {
        this.owners.set( roomId, UNOWNED );
    }

    owned( roomId: string, ip: string, nowMs: number ): void {
        if ( this.owners.get( roomId ) !== UNOWNED ) return;
        this.owners.set( roomId, ip );
        const left = this.recent( this.pending, ip, nowMs, PENDING_MS ).slice( 1 );
        if ( left.length > 0 ) this.pending.set( ip, left );
        else this.pending.delete( ip );
    }

    closed( roomId: string ): void {
        this.owners.delete( roomId );
    }

    liveFor( ip: string, nowMs: number ): number {
        let live = this.recent( this.pending, ip, nowMs, PENDING_MS ).length;
        for ( const owner of this.owners.values() ) if ( owner === ip ) live++;
        return live;
    }

    tracked(): number {
        return this.creates.size + this.pending.size;
    }

    private isCreate( call: MatchmakeCall ): boolean {
        if ( call.roomName !== ROOM_NAME ) return false;
        if ( call.method === 'create' ) return true;
        return call.method === 'joinOrCreate' && ! this.joinsExisting( call );
    }

    private recent( times: Map< string, number[] >, ip: string, nowMs: number, windowMs: number ): number[] {
        const list = ( times.get( ip ) ?? [] ).filter( ( t ) => nowMs - t < windowMs );
        if ( list.length > 0 ) times.set( ip, list );
        else times.delete( ip );
        return list;
    }

    private sweep( nowMs: number ): void {
        for ( const ip of [ ...this.creates.keys() ] ) this.recent( this.creates, ip, nowMs, CREATE_WINDOW_MS );
        for ( const ip of [ ...this.pending.keys() ] ) this.recent( this.pending, ip, nowMs, PENDING_MS );
    }
}

export const createQuota = new CreateQuota( () => roomCodes.publicRoom() !== null );
