import { getStateCallbacks, type Room } from '@colyseus/sdk';
import { HeldPower, PHASE, type PlayerState, type ProjectileState, type RunState } from '@slur/shared';
import { playMusic } from './audio-engine';
import { MUSIC, playSfx } from './sfx-map';

// ── Room events → SFX/music, client-local. ───────────────────────────────────────────────────────────────
// Binds the S5 combat events already on the wire to the audio engine. A PURE function returning a teardown
// (same shape/discipline as attach-room-to-world) so <GameAudio> stays a thin leaf. It only SUBSCRIBES via a
// fresh getStateCallbacks(room) — it never owns/leaves the room. Multiple getStateCallbacks subscriptions
// coexist (the overlays already add their own), so nothing here clobbers the hit-spark / held-power wiring.
//
// Signal sources (why each, not a second 'hit' onMessage — that would clobber attach-room-to-world's handler):
//  • stunTimer RISING edge on ANY player  → a ship just got hit → 'hit'; if it's ME, also 'stun' (disrupt whine).
//  • heldPower none→armed on the LOCAL player → pickup grabbed → 'pickup'.
//  • dead edges on the LOCAL player        → 'death' (derezz) / 'respawn'.
//  • projectiles.onAdd owned by ME         → 'fire' (bolt launch).
//  • a HOSTILE bolt entering my rear lane   → 'threat' telegraph (once per bolt).
//  • phase → 'go' at GO + music bed switch; countdown ceil steps → rising 'countdown' blips.

const THREAT_Z = 90; // a hostile bolt within this many units behind me is "incoming" (bolts outrun ships)
const THREAT_X = 8; // and within this lateral window shares my lane closely enough to warn

export function bindRoomAudio( room: Room< RunState > ): () => void {
    const $ = getStateCallbacks( room );
    const me = room.sessionId;
    // Per-entity onChange detaches, keyed like the prev* maps below. Every HOSTILE bolt registers one of
    // these on spawn, so it MUST come off in onRemove — a flat array drained only at teardown grows for the
    // whole run and keeps each dead bolt's schema object reachable.
    const perPlayer = new Map< string, () => void >();
    const perProjectile = new Map< string, () => void >();

    const prevStun = new Map< string, number >();
    const prevHeld = new Map< string, number >();
    const prevDead = new Map< string, boolean >();
    const threatened = new Set< string >(); // bolt ids already telegraphed (no re-blip)

    // Local-player edges (pickup grab + derezz/respawn). Split out to keep onPlayerChange simple.
    const localEdges = ( p: PlayerState ): void => {
        const ph = prevHeld.get( me ) ?? HeldPower.none;
        if ( ph === HeldPower.none && p.heldPower !== HeldPower.none ) playSfx( 'pickup' );
        prevHeld.set( me, p.heldPower );

        const pd = prevDead.get( me ) ?? false;
        if ( ! pd && p.dead ) playSfx( 'death' );
        else if ( pd && ! p.dead ) playSfx( 'respawn' );
        prevDead.set( me, p.dead );
    };

    const onPlayerChange = ( sid: string, p: PlayerState ): void => {
        const ps = prevStun.get( sid ) ?? 0;
        if ( ps <= 0 && p.stunTimer > 0 ) {
            playSfx( 'hit' ); // any ship taking an impact
            if ( sid === me ) playSfx( 'stun' ); // ...and the disrupt whine when it's you
        }
        prevStun.set( sid, p.stunTimer );
        if ( sid === me ) localEdges( p );
    };

    const offAdd = $( room.state ).players.onAdd( ( p, sid ) => {
        prevStun.set( sid, p.stunTimer );
        prevHeld.set( sid, p.heldPower );
        prevDead.set( sid, p.dead );
        perPlayer.set(
            sid,
            $( p ).onChange( () => onPlayerChange( sid, p ) ),
        );
    } );
    const offRemove = $( room.state ).players.onRemove( ( _p, sid ) => {
        perPlayer.get( sid )?.();
        perPlayer.delete( sid );
        prevStun.delete( sid );
        prevHeld.delete( sid );
        prevDead.delete( sid );
    } );

    // A hostile bolt in my rear lane → telegraph once. Checked on spawn AND as it approaches (onChange).
    const checkThreat = ( proj: ProjectileState, id: string ): void => {
        if ( proj.ownerId === me || threatened.has( id ) ) return;
        const self = room.state.players.get( me );
        if ( ! self || self.spectating || self.dead ) return;
        const dz = self.z - proj.z; // >0 ⇒ bolt behind me (closing)
        if ( dz > -4 && dz < THREAT_Z && Math.abs( proj.x - self.x ) < THREAT_X ) {
            threatened.add( id );
            playSfx( 'threat' );
        }
    };

    const offProjAdd = $( room.state ).projectiles.onAdd( ( proj, id ) => {
        if ( proj.ownerId === me ) {
            playSfx( 'fire' ); // your own bolt launching
            return;
        }
        checkThreat( proj, id );
        perProjectile.set(
            id,
            $( proj ).onChange( () => checkThreat( proj, id ) ),
        );
    } );
    const offProjRemove = $( room.state ).projectiles.onRemove( ( _proj, id ) => {
        perProjectile.get( id )?.();
        perProjectile.delete( id );
        threatened.delete( id );
    } );

    // Phase → GO stinger + which music bed loops. `.listen` fires immediately with the current value, so the
    // correct bed starts on bind; the prevPhase guard keeps 'go' from firing on that immediate call.
    let prevPhase = room.state.phase;
    const offPhase = $( room.state ).listen( 'phase', ( v ) => {
        if ( v === PHASE.racing && prevPhase !== PHASE.racing ) playSfx( 'go' );
        playMusic( v === PHASE.racing ? MUSIC.run.name : MUSIC.lobby.name );
        prevPhase = v;
    } );

    // Countdown → a rising-pitch blip on each integer step (3→2→1). rate lifts the pitch as GO nears.
    let prevCeil = Math.ceil( room.state.countdown );
    const offCd = $( room.state ).listen( 'countdown', ( v ) => {
        const c = Math.ceil( v );
        if ( v > 0 && c !== prevCeil && c <= 3 ) playSfx( 'countdown', { rate: 1 + ( 3 - c ) * 0.14 } );
        prevCeil = c;
    } );

    return () => {
        offAdd();
        offRemove();
        offProjAdd();
        offProjRemove();
        offPhase();
        offCd();
        for ( const off of perPlayer.values() ) off();
        for ( const off of perProjectile.values() ) off();
        perPlayer.clear();
        perProjectile.clear();
    };
}
