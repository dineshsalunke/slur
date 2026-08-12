import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { PHASE, type RunState } from '@slur/shared';
import { useEffect, useState } from 'react';

// A plain, React-friendly snapshot of one player (schema → immutable view). The overlays render off THIS, never
// off room.state directly (Colyseus schema is NOT React-reactive — reading it during render desyncs; memory
// `colyseus-state-not-reactive`).
export interface PlayerView {
    id: string;
    name: string;
    colorId: number;
    shipId: string;
    spectating: boolean;
    finished: boolean;
    finishTime: number;
    connected: boolean;
    z: number;
}

// The whole run, snapshotted. `selfId` is the connection sessionId (NOT schema state — safe to read anytime).
export interface RunView {
    phase: number;
    countdown: number;
    elapsed: number;
    finishDeadline: number;
    hostId: string;
    selfId: string;
    players: PlayerView[];
}

// Rebuild the immutable snapshot from live schema. Called ONLY inside schema callbacks (never during render), so
// the not-reactive read is safe here — the callback is the very notification the rule says to bridge through.
function readView( room: Room< RunState > ): RunView {
    const s = room.state;
    const players: PlayerView[] = [];
    s.players.forEach( ( p, id ) => {
        players.push( {
            id,
            name: p.name,
            colorId: p.colorId,
            shipId: p.shipId,
            spectating: p.spectating,
            finished: p.finished,
            finishTime: p.finishTime,
            connected: p.connected,
            z: p.z,
        } );
    } );
    return {
        phase: s.phase,
        countdown: s.countdown,
        elapsed: s.elapsed,
        finishDeadline: s.finishDeadline,
        hostId: s.hostId,
        selfId: room.sessionId,
        players,
    };
}

// The LOW-FREQUENCY slice: phase alone. <Overlays> subscribes to THIS and nothing else, so a phase switch is
// the only thing that re-renders the overlay root — and therefore the only thing that re-renders the siblings
// it wraps (LeaveGuard, LeaveButton, HeldPowerChip, ThreatHud), none of which read the clock or the roster.
// The high-frequency fields stay inside whichever phase panel actually reads them, via useRunView below.
// That is non-negotiable #10: push each subscription down to its leaf; never subscribe high and prop-drill.
export function useRunPhase( room: Room< RunState > ): number {
    const [ phase, setPhase ] = useState< number >( PHASE.lobby );

    // JUSTIFIED EFFECT — same external system, same reasoning as useRunView below: Colyseus schema callbacks
    // are not React-reactive, so the wire → React bridge has to be registered somewhere. `listen` fires
    // immediately with the current value, so no separate initial read is needed. Cleanup only detaches the
    // callback; it never touches the connection (the loader owns the room).
    useEffect( () => {
        const $ = getStateCallbacks( room );
        return $( room.state ).listen( 'phase', ( value ) => setPhase( value ) );
    }, [ room ] );

    return phase;
}

// The FULL snapshot. Subscribed by the ONE phase panel that is mounted at a time (LobbyOverlay / RaceHud /
// ResultsOverlay / CountdownOverlay), never by their parent — so the ~20Hz churn it carries re-renders only
// the panel that reads it, and still NEVER reaches <NetCanvas> (acceptance gate #1). Note `players` is NOT
// low-frequency during a race: it carries each ship's `z`, which simulate() moves every tick, so this hook
// rebuilds at patch rate whether or not `elapsed` is in it. Standings come from shared
// computeStandings(view.players.map(p => ({ ...p }))).
export function useRunView( room: Room< RunState > ): RunView {
    // Seed with connection-level fields only (room.sessionId is NOT schema → safe during render). Schema fields
    // stay at defaults for one commit until the effect's initial rebuild lands — a harmless first-paint flash.
    const [ view, setView ] = useState< RunView >( () => ( {
        phase: PHASE.lobby,
        countdown: 0,
        elapsed: 0,
        finishDeadline: 0,
        hostId: '',
        selfId: room.sessionId,
        players: [],
    } ) );

    // JUSTIFIED EFFECT — syncs with an external system: the Colyseus room's schema callbacks (NOT React-reactive).
    // room.state mutates over the wire outside React and fires no re-render, so we bridge it into React state here.
    //  1) render-derivation? no — schema deltas arrive over the wire; nothing to derive from props/render.
    //  2) event handler? no DOM/user event — these are network callbacks the effect registers.
    //  3) loader/action data? no — a live per-patch stream, not navigation data (the loader OWNS the room; this
    //     only SUBSCRIBES — moving ownership here would be the S2 create→leave churn, which we never do).
    //  4) ref/module singleton? the room is already loader/singleton-owned (read via prop); only the callback
    //     registrations need mount-scoped teardown. 5) external sync? YES — schema callbacks → setState.
    //  VERDICT: keep. Cleanup detaches every callback; it never touches the connection.
    useEffect( () => {
        const $ = getStateCallbacks( room );
        const offs: Array< () => void > = [];
        const rebuild = () => setView( readView( room ) );

        offs.push( $( room.state ).listen( 'phase', rebuild ) );
        offs.push( $( room.state ).listen( 'countdown', rebuild ) );
        offs.push( $( room.state ).listen( 'elapsed', rebuild ) );
        offs.push( $( room.state ).listen( 'finishDeadline', rebuild ) );
        offs.push( $( room.state ).listen( 'hostId', rebuild ) );

        const perPlayer = new Map< string, () => void >();
        offs.push(
            $( room.state ).players.onAdd( ( p, sid ) => {
                perPlayer.set( sid, $( p ).onChange( rebuild ) );
                rebuild();
            } ),
        );
        offs.push(
            $( room.state ).players.onRemove( ( _p, sid ) => {
                perPlayer.get( sid )?.();
                perPlayer.delete( sid );
                rebuild();
            } ),
        );

        rebuild(); // initial snapshot (onAdd for existing players may have fired before this effect ran)
        return () => {
            for ( const off of offs ) off();
            for ( const off of perPlayer.values() ) off();
        };
    }, [ room ] );

    return view;
}
