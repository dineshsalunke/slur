// S4 race lifecycle — the PURE, framework-free brain the server room calls as glue. No @colyseus/schema
// here (the shared-package rule); every function is deterministic and headlessly tested in director.test.ts,
// so run-room.ts stays thin orchestration over these.

import { COLOR_COUNT, MAX_RACE_SECONDS, START_STAGGER } from '../constants.js';
import { copySimShip, type SimShip, spawnShip } from '../sim/types.js';

// 4-phase run lifecycle. GO (host, from lobby) is the SINGLE lock line: picks + ships freeze the instant we
// leave `lobby`. Countdown is prep only — no ship motion. The sim integrates ships ONLY in `racing`.
export const PHASE = { lobby: 0, countdown: 1, racing: 2, finished: 3 } as const;
export type Phase = ( typeof PHASE )[ keyof typeof PHASE ];

// Session commands (client→server messages). Colocated with the lifecycle they drive — the house pattern
// (INPUT_MESSAGE lives in sim/input.ts, SET_CLASS_MESSAGE in ship-classes.ts), not a central messages file.
export const START_MESSAGE = 'start'; // host: lobby → countdown (locks the field)
export const RESTART_MESSAGE = 'restart'; // host: finished → lobby (re-open picks)
export const SET_COLOR_MESSAGE = 'setColor'; // player: pick team colour (accepted in lobby only)

export function isColorId( n: unknown ): n is number {
    return typeof n === 'number' && Number.isInteger( n ) && n >= 0 && n < COLOR_COUNT;
}

// Join policy for Race: joining once the field is locked (any phase past lobby) ⇒ spectate until the next
// round. The onJoin spawn-stagger is kept for live drop-in. (ADR-004: the old endless-Survival branch this
// once anticipated — a mode that returned `false` here for drop-in-beside-pack — is obsolete; Survival was
// dropped and the game is a finite Race, so this is now the single, unconditional policy.)
export function shouldSpectateOnJoin( phase: number ): boolean {
    return phase !== PHASE.lobby;
}

// Room-list metadata — the plain (NON-schema) object the room publishes via setMetadata and the client's
// RoomList reads off each `IRoomCache.metadata`. Shared so both ends agree on the shape. Live client count
// comes from `IRoomCache.clients` (always current), so it is deliberately NOT duplicated here.
export interface RunMetadata {
    hostName: string;
    phase: number; // a PHASE value; typed `number` to mirror the schema's uint8 (no cast needed either end)
}

// The race-frozen ship fields (structural — a Colyseus PlayerState satisfies this). `finishTime` is the
// schema's extra-beyond-SimShip field, typed here so a reset zeroes it too.
type RacerState = SimShip & { finishTime: number };

// Put a racer on the start line for a fresh race: start-safe zone (z=0), staggered laterally by seat index,
// every transient / collision / finish field zeroed. Mirrors spawnShip() but MUTATES IN PLACE — the schema
// instance is authoritative and the sim aliases it structurally, so allocating a fresh object would break
// that aliasing. Called for each racer at GO and for everyone on restart.
export function resetPlayerForRace( p: RacerState, index: number ): void {
    const x = index * START_STAGGER; // left-aligned stagger (matches onJoin); centring is a feel-gate tweak.
    copySimShip( p, spawnShip( x, 0 ) ); // reset every SimShip field to a fresh start-line spawn (exhaustive; lastSafeX=x)
    p.finishTime = 0; // schema-extra beyond SimShip (server-stamped at finish) — zero it for the new race
}

// Standings input — the fields ranking reads off each player (structural; the room builds these from the
// players map, keyed by sessionId).
export interface StandingInput {
    id: string; // sessionId
    name: string;
    colorId: number;
    shipId: string;
    spectating: boolean;
    finished: boolean;
    finishTime: number;
    z: number;
}

export interface Standing extends StandingInput {
    rank: number; // 1-based, over racers only
    dnf: boolean; // did-not-finish when the race ended
}

// Race order: finishers first by finishTime (asc), then non-finishers by distance (z desc), flagged DNF.
// Spectators are excluded — they aren't racing this round. Pure + deterministic: Array.sort is stable, so
// equal keys keep input order (ties resolve reproducibly).
export function computeStandings( players: Iterable< StandingInput > ): Standing[] {
    const racers = [ ...players ].filter( ( p ) => ! p.spectating );
    racers.sort( ( a, b ) => {
        if ( a.finished !== b.finished ) return a.finished ? -1 : 1; // finisher outranks non-finisher
        if ( a.finished && b.finished ) return a.finishTime - b.finishTime; // both finished → faster first
        return b.z - a.z; // both DNF → further along the track ranks higher
    } );
    return racers.map( ( p, i ) => ( { ...p, rank: i + 1, dnf: ! p.finished } ) );
}

// Race-end predicate (leader + grace, with a safety cap). `elapsed` is the RACE clock — reset to 0 at GO and
// advanced ONLY during racing, so finishTime and the deadline are race-relative. `finishDeadline` is 0 until
// the first finisher, then elapsed+GRACE.
export interface RaceEndInput {
    elapsed: number;
    finishDeadline: number;
    racerCount: number;
    finishedCount: number;
}

export function raceShouldEnd( i: RaceEndInput ): boolean {
    if ( i.racerCount === 0 ) return true; // everyone left → don't hang in racing forever
    if ( i.finishedCount >= i.racerCount ) return true; // whole field finished → results now
    if ( i.finishDeadline > 0 && i.elapsed >= i.finishDeadline ) return true; // leader's grace window expired
    if ( i.elapsed >= MAX_RACE_SECONDS ) return true; // safety: nobody finished in time → end as all-DNF
    return false;
}
