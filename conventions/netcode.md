# Netcode Conventions

> Sources (verified 2026-08-06):
> - Gabriel Gambetta, "Fast-Paced Multiplayer" — https://www.gabrielgambetta.com/client-server-game-architecture.html (+ client-side-prediction-server-reconciliation, entity-interpolation, lag-compensation chapters)
> - Valve, "Source Multiplayer Networking" — https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking (fetched via mirror gist.github.com/CoolOppo/fe0586836de3fb2f90f9; wiki 403s to bots)
> - Glenn Fiedler / Gaffer On Games — "Snapshot Interpolation" https://gafferongames.com/post/snapshot_interpolation/ and "Fix Your Timestep!" https://gafferongames.com/post/fix_your_timestep/
> - Colyseus docs — https://docs.colyseus.io/server/room (patchRate, setSimulationInterval)
>
> Context: Colyseus + WebSocket (TCP), office LAN, ~2-12 players, 60fps ship racer, server-authoritative, PvP combat, join-mid-run.

---

## TL;DR — the rules that matter most

1. **Server is the single source of truth.** Clients send *inputs*, never positions. The server simulates and owns the state. (Gambetta, Valve — both open with this.)
2. **Send inputs, not positions. Number every input** with a monotonic sequence id. The server echoes back the last-processed sequence id so the client can reconcile.
3. **Predict your own ship locally** (apply input immediately, don't wait for the round trip), then **reconcile**: on each server snapshot, snap to the authoritative state and *replay* all inputs the server hasn't acknowledged yet.
4. **Interpolate remote ships** — render them ~1 snapshot in the past, smoothly interpolating between the two most recent server states. Never predict/extrapolate remote ships as the default.
5. **Fixed timestep simulation on both ends** (e.g. 60Hz sim). Decouple it from render (also 60Hz but via interpolation) and from network patch rate (~20Hz). Same integration code, same `dt`.
6. **Two clocks, three rates:** sim tick (60Hz), network patch (Colyseus `patchRate`, default 50ms = 20Hz), render (60fps rAF). Never conflate them.
7. **Combat hit-detection is server-authoritative.** Client sends "I fired, aim vector, at input seq N." Server decides hits. Client shows *cosmetic* tracers/muzzle flash immediately, but damage is server's call.
8. **On LAN, skip full lag compensation for now.** Latency is ~0.5-5ms; the interpolation buffer dominates. Build the architecture so lag comp can be *added* later, but don't pay for it now.

---

## Core Model (server-authoritative, inputs-not-positions)

Both Gambetta and Valve start from the same axiom: **the game state lives on the server; clients send actions, the server computes results.** This is the anti-cheat foundation — a client that sends "my new position is X" can teleport, speed-hack, and shoot through walls. A client that sends "I am holding thrust + banking left" can only ever *request* movement the server validates.

**Concretely for our ship racer:**

- Client captures input each sim tick: `{ seq, thrust, strafe/bank, boost, fire }`. That's it — booleans/axes, plus the sequence number and the client tick it was sampled on.
- Client sends the input to the server (Colyseus `room.send("input", cmd)`).
- Server buffers incoming inputs per player, and on each server sim tick drains the queue, applies each input through the **shared movement function** `simulate(shipState, input, dt)`, and updates the authoritative `@colyseus/schema` state.
- Server broadcasts state via automatic patches at `patchRate`. Each player's schema carries `lastProcessedInput` (the seq of the last input the server consumed for that player).

**Why inputs not positions (the WHY):**
- Cheat resistance — the server never trusts a claimed position.
- Determinism/reconciliation — the client can re-run the *same* input function to predict and to replay pending inputs after a correction. If the client sent positions, there'd be nothing to replay.
- Bandwidth — an input packet is a handful of bytes; a full position/orientation/velocity is larger and must be sent every tick regardless.

**Client authority trade-off (and when it's acceptable):** Client authority (client sends position, server relays) is simpler and has zero correction jitter, but it is *unfixably* cheatable and desyncs on packet loss. It is only defensible for cosmetic/non-competitive state (e.g. a purely visual cosmetic trail). For anything that affects the race or combat outcome: server-authoritative, no exceptions. On a trusted office LAN cheating is a low threat *today*, but client authority also throws away reconciliation and makes join-mid-run and hit-reg incoherent — so we still go server-authoritative on gameplay state.

---

## Client Prediction & Reconciliation

Server authority alone feels awful: every input waits a full round trip before the ship moves. The fix (Gambetta ch. 2; Valve `cl_predict 1`) is **client-side prediction with server reconciliation.**

**Algorithm (Gambetta, verbatim mechanics):**

1. Client assigns each input a **sequence number** and applies it *immediately* to its local (predicted) ship via the shared `simulate()` function — no waiting.
2. Client keeps every not-yet-acknowledged input in a **pending list**.
3. Client also sends the input to the server.
4. Server processes inputs authoritatively and includes, in its state, the **sequence number of the last input it processed** for that client (`lastProcessedInput`).
5. When a snapshot arrives, the client:
   a. **Snaps** its ship to the authoritative position/velocity from the snapshot.
   b. **Discards** all pending inputs with `seq <= lastProcessedInput`.
   c. **Re-applies (replays)** every remaining pending input through `simulate()` on top of the authoritative state.

The result: the ship is anchored to server truth but re-extrapolated to "now" through the inputs the server hasn't seen yet. When prediction was correct (the common case), the replay lands exactly where the client already was — no visible correction. When it diverges (collision the client didn't predict, power-up effect), the ship smoothly resolves to truth.

**Rules / footguns:**
- **The movement function MUST be identical on client and server** — same math, same `dt`, same fixed timestep. Share it as one module imported by both (a big reason to keep the sim in TypeScript on both ends). Divergent code → constant misprediction → permanent jitter.
- **Only predict the local player.** Do not predict remote ships this way (see Interpolation).
- **Predict deterministically.** Prediction that depends on other players' state (which the client sees in the past) will mispredict on contact. Accept that combat contact will produce a correction; keep corrections small by keeping the sim deterministic.
- **Smooth large corrections** (optional polish): instead of hard-snapping on a big divergence, blend over 2-3 frames. On LAN divergences are rare and tiny, so a hard snap is usually invisible — don't over-engineer this initially.

---

## Entity Interpolation (remote players)

You cannot predict other ships (you don't have their inputs). If you just slam remote ships to each incoming snapshot position, at 20Hz they teleport in 50ms discrete jumps — choppy. The fix (Gambetta ch. 3; Valve `cl_interp`; Fiedler "Snapshot Interpolation") is **entity interpolation: render remote entities slightly in the past, smoothly interpolating between two real snapshots you've already received.**

**Mechanism:**
- Buffer incoming snapshots per remote entity with their server timestamps.
- Render remote ships at `renderTime = now - interpolationDelay`.
- Find the two buffered snapshots that straddle `renderTime` and **linearly interpolate** position; **slerp** orientation (Fiedler: linear interp of orientation "pulses"; slerp fixes it). Ship velocities are smooth enough that linear position interpolation is fine at LAN rates; Hermite (velocity-aware) interpolation is a later upgrade if you see artifacts.
- **You are always interpolating between two states you already have** — never extrapolating into the unknown. Extrapolation guesses and is wrong on any direction change (Fiedler shows it tunnelling objects through floors).

**Interpolation delay — the key number:**
- It must be **≥ one snapshot interval** so you always have a "next" snapshot to interpolate toward. At 20Hz patch rate that's ≥50ms.
- Valve's default `cl_interp` is **100ms** = 2 snapshots at their update rate — deliberately generous to survive packet loss. Their formula: `interp = max(cl_interp, cl_interp_ratio / cl_updaterate)`.
- **For our LAN, use ~50-100ms.** Start at ~2x patch interval (≈100ms) for safety; you can tighten toward 50ms because LAN jitter/loss is negligible. This delay is the price of smoothness and is imperceptible for a racer.

**Everyone sees themselves in the present, others in the past** (Gambetta). That asymmetry is intentional and fine — until combat, where it forces a decision (see Combat).

**Anti-pattern:** extrapolating remote ships to "hide" the delay. On a fast racer with banking/boosting, extrapolation overshoots on every turn and produces rubber-banding worse than the delay it hides.

---

## Tick Rates & Fixed Timestep (server sim, patchRate, client render)

Three independent rates. Keep them separate in code.

| Clock | Rate | What it is |
|---|---|---|
| **Server simulation** | 60Hz fixed (`dt = 1/60 ≈ 16.67ms`) | Authoritative physics/movement step. |
| **Network patch (Colyseus `patchRate`)** | 20Hz (default **50ms**) | How often Colyseus diffs `@colyseus/schema` state and broadcasts patches. |
| **Client render** | 60fps (`requestAnimationFrame`) | Draw. Interpolates between sim states / snapshots. |

**Why fixed timestep (Fiedler "Fix Your Timestep!"):** physics behaviour *depends on `dt`*. Variable `dt` makes the sim non-deterministic — springs explode, fast ships tunnel through track walls, and, fatally for us, **client prediction and server sim diverge** because they stepped with different `dt`s. Fixed `dt` gives reproducible, matching results on both ends. This is a hard requirement for prediction/reconciliation to work.

**The accumulator pattern (Fiedler), applied on the server via Colyseus `setSimulationInterval`:**

```
// Colyseus room
const FIXED_DT = 1000 / 60; // ms
let accumulator = 0;

this.setSimulationInterval((deltaTime) => {   // deltaTime = ms since last call
  accumulator += deltaTime;
  while (accumulator >= FIXED_DT) {
    for (const player of players) {
      let input;
      while ((input = player.inputQueue.shift())) {
        simulate(player, input, FIXED_DT / 1000);
        player.lastProcessedInput = input.seq;
      }
    }
    stepWorld(FIXED_DT / 1000); // projectiles, pickups, collisions
    accumulator -= FIXED_DT;
  }
});
this.setPatchRate(50); // 20Hz broadcast (this is the default)
```

- `setSimulationInterval` runs your loop (default tick ~16.6ms if unspecified); the accumulator decouples the *logical* fixed step from the wall-clock jitter of `setInterval`.
- **Drain the per-player input queue inside the fixed step**, applying each input and recording its seq as `lastProcessedInput`.
- **`patchRate` (broadcast) is independent of the sim.** Sim at 60Hz for smooth physics; broadcast at 20Hz to save bandwidth. The client bridges the 20Hz→60fps gap by interpolating.

**Client render loop:** run its own fixed-step predicted sim at 60Hz for the local ship (matching the server), and for remote ships interpolate between buffered 20Hz snapshots. Use the accumulator remainder (`alpha = accumulator / FIXED_DT`) to interpolate the *local* predicted ship between its previous and current sim states so rendering is smooth even if render and sim edges don't align (Fiedler's render interpolation).

**Spiral of death (Fiedler):** if a tick takes longer than `FIXED_DT`, the `while` loop asks for more steps, falling further behind. Guard with a **max steps per frame** clamp (e.g. bail after ~5 accumulated steps and drop the remainder). Unlikely on LAN with 12 players, but cheap insurance.

**Head-of-line blocking (TCP / WebSocket) — acknowledge it:** UDP games drop stale packets; TCP *cannot* — a lost segment stalls everything behind it until retransmit (Fiedler and Valve both mandate UDP precisely to avoid this). Colyseus runs over TCP WebSocket, so a single drop delays the whole patch stream. **On a wired office LAN this is a near-non-issue** (loss ≈ 0, retransmit ≈ sub-ms). Implications we still respect:
- Keep messages small and at a modest rate (20Hz patches) so we never queue faster than the socket drains.
- The interpolation buffer (~50-100ms) already absorbs the rare hiccup.
- Do **not** design around UDP-only tricks (unreliable redundant snapshots, packet-loss-tolerant delta encoding). We don't have them and don't need them on LAN. If this ever ships over the public internet, TCP HOL blocking becomes a real ceiling and would justify moving to WebTransport/UDP — note it as the upgrade path, don't build for it now.

---

## Join-Mid-Run & State Catch-up

A player joins a LIVE run and must spawn beside in-flight ships. Colyseus handles most of this cleanly because state is a replicated schema, not an event log.

**Flow:**
1. **`onJoin`:** the new client automatically receives the **full current state** (Colyseus sends a complete schema snapshot to a joining client, then deltas thereafter). No custom catch-up protocol needed for world state.
2. **Server picks a spawn** authoritatively: choose a track distance/lane just ahead-or-beside the pack (or a safe slot), set the new ship's position/velocity, mark it `alive`. Never let the client choose its spawn (cheat + collision chaos).
3. **Client seeds interpolation:** the new client won't render remote ships until it has ≥2 snapshots (needs two to interpolate). For the first ~1 interpolation-delay it may only have one — hold ships at the first known pose until the second snapshot arrives, then interpolate. Don't extrapolate from a single snapshot.
4. **Local prediction starts fresh:** the joiner's `lastProcessedInput` begins at 0; prediction/reconciliation works from the first input as normal.
5. **Grace / spawn protection (gameplay, not netcode):** brief invulnerability + no-collision on spawn so joiners don't instantly die materializing inside the pack. This is a design choice but the *authority* stays server-side.

**Footguns:**
- **Track/world must be deterministic or explicitly synced.** If the endless track is procedurally generated, the generation seed must be in the room state so a joiner renders the *same* track the server is simulating. A client that generates its own track from a different seed will desync collisions. Put the seed (and current track offset) in the schema.
- **Don't replay history to catch up.** Snapshot-based sync means "here is the world now," not "replay 3 minutes of events." Joiners get current state and go. (This is exactly why snapshot interpolation beats deterministic lockstep for join-in-progress — lockstep would need the full input history.)
- **Interpolation warm-up gap:** the "only one snapshot" window above is the classic new-joiner glitch (remote ships frozen for ~50-100ms). Handle it explicitly rather than letting ships jump.

---

## Combat / Hit Detection Authority

PvP shooting/affecting other ships. **Hit detection is server-authoritative. Full stop.**

**Why never trust the client (the WHY):**
- A client that reports its own hits is an aimbot API: "I hit everyone, every frame." Damage, kills, power-up steals — all forgeable.
- Two clients see each other in the *past* (interpolation) and see themselves in the *present* (prediction). They disagree about positions at any instant. Only the server has a coherent timeline to adjudicate.

**Baseline hit-reg for our game (do this now):**
- Client sends a **fire intent**: `{ type: "fire", aimVector/targetDir, clientTick, inputSeq }`. It may show *cosmetic* muzzle flash / tracer immediately (feels responsive, costs nothing if wrong).
- Server, on its sim tick, spawns the projectile (or does the hitscan) **from the authoritative shooter state** and resolves collisions against **authoritative ship positions**. Server applies damage/effects and reflects them in state.
- For projectiles (likely for a ship racer — homing shots, mines, boost-wash), the projectile is a **server-simulated entity** in the schema; clients interpolate it like any remote entity. This sidesteps most timing arguments because the projectile physically travels in server time.

**Lag compensation (the advanced tier — Valve's rewind):** For instant hitscan, the server can rewind other ships' positions to *when the shooter fired* (`Command Execution Time = server time − packet latency − client interpolation`, Valve) so the shooter doesn't have to lead by their latency. Downside (Gambetta/Valve): the target can be hit a few ms *after* they think they reached cover — "shot behind cover." It trades defender fairness for shooter feel.

**On LAN we do NOT need lag compensation yet:** total offset = ~1-5ms latency + ~50-100ms interp delay. The interp delay dominates and is identical for everyone. For a casual racer with mostly *projectile* combat (which is self-compensating), server-side hit-reg against current authoritative positions is accurate enough that leading is negligible. **Prefer projectiles over instant hitscan** partly for this reason. If you later add instant hitscan weapons *and* players complain about needing to lead, add Valve-style rewind — the architecture (server owns positions + timestamps) already supports it. Keep a short **position history ring buffer** per ship on the server even now (cheap) so lag comp is a drop-in later.

---

## Pragmatic Baseline for LAN (do now vs later)

**DO NOW (the minimum that feels good and is correct):**
1. Server-authoritative state; clients send **inputs with sequence numbers** only.
2. **Shared fixed-timestep `simulate()` module** imported by client and server (60Hz, fixed `dt`).
3. Server loop via `setSimulationInterval` + **accumulator**, draining per-player input queues, recording `lastProcessedInput`.
4. **Client-side prediction + reconciliation** for the local ship.
5. **Entity interpolation** for remote ships at ~50-100ms delay (linear pos, slerp rotation).
6. **Colyseus `patchRate` = 50ms (20Hz)**; sim at 60Hz; render at 60fps.
7. **Server-authoritative hit detection**; prefer **server-simulated projectiles**; cosmetic client-side muzzle/tracer only.
8. **Join-mid-run:** rely on Colyseus full-state-on-join; server-chosen spawn; put track seed/offset in schema; handle the 2-snapshot interpolation warm-up.
9. Cheap **per-ship position-history ring buffer** on the server (enables future lag comp for free).

**LATER / PREMATURE NOW (upgrade path — don't build yet):**
- **Full lag compensation (position rewind).** Overkill at LAN latency; add only if you ship instant-hitscan weapons and players feel they must lead. Hooks already in place via the ring buffer.
- **Hermite (velocity-aware) interpolation & slerp tuning.** Only if linear interpolation shows visible artifacts on hard banks.
- **Correction smoothing / error blending.** Only if hard-snaps become visible (they won't at LAN misprediction sizes).
- **Delta-compression / snapshot bit-packing / interest management.** Colyseus already delta-encodes schema patches; 12 players on LAN is nowhere near a bandwidth wall.
- **UDP/WebTransport transport swap.** Only relevant if this leaves the LAN and TCP head-of-line blocking becomes a real latency ceiling.
- **Deterministic lockstep.** Wrong model for us — breaks join-in-progress and needs perfect cross-machine determinism. Snapshot + prediction is the right family.

**Rule of thumb:** build the *architecture* for the internet (inputs, seqs, prediction, interpolation, server authority) because those are load-bearing and hard to retrofit; skip the *latency-hiding polish* (lag comp, error smoothing, transport tricks) because LAN latency makes them invisible and they're easy to add on the existing skeleton.

---

## Anti-Patterns & Bad Practices (each with WHY)

- **Client sends positions instead of inputs.** WHY bad: uncheatable-to-verify, no reconciliation possible (nothing to replay), desyncs on loss. This is the cardinal sin both Valve and Gambetta open by forbidding.
- **Trusting the client for hits/damage/kills.** WHY: it's a ready-made aimbot; clients disagree about positions by design (past vs present), so only the server has a coherent timeline.
- **No input sequence numbers.** WHY: reconciliation is impossible — the client can't know which pending inputs to discard vs replay, so it either double-applies inputs or snaps backward every snapshot (rubber-banding).
- **Different sim code / different `dt` on client vs server.** WHY: guarantees constant misprediction → perpetual correction jitter. Fixed timestep + one shared `simulate()` is mandatory (Fiedler).
- **Variable timestep physics.** WHY: non-deterministic — tunnelling through track walls, exploding forces, and client/server divergence (Fiedler's whole thesis).
- **Extrapolating remote entities as the default.** WHY: guesses the future and is wrong on every direction change; on a banking/boosting racer it overshoots and rubber-bands worse than the interpolation delay it tries to hide (Fiedler).
- **Rendering remote ships at zero delay / snapping to each snapshot.** WHY: 20Hz snapshots become 50ms teleport jumps. Interpolation delay is the intended cost of smoothness.
- **Interpolating with only one snapshot (or delay < snapshot interval).** WHY: no "next" state to interpolate toward → you fall back to extrapolation/freezing. Delay must be ≥ one patch interval; this is the classic new-joiner freeze.
- **Coupling sim rate to patch rate to render rate.** WHY: forces bad trade-offs (either 60Hz bandwidth or 20Hz physics). They must be three independent clocks bridged by interpolation.
- **Ticking the sim off wall-clock `deltaTime` with no accumulator.** WHY: a slow frame steps a huge `dt` (tunnelling), and it's non-reproducible. Accumulator + fixed step, with a max-steps clamp to dodge the spiral of death (Fiedler).
- **Letting the joining client choose its own spawn.** WHY: cheat vector + collision chaos spawning inside the pack; spawn is a server authority decision.
- **Procedural track generated client-side from an unsynced seed.** WHY: each client simulates a different world → collisions and pickups desync. Seed/offset must live in server state.
- **Designing around UDP tricks on a TCP/WebSocket transport.** WHY: Colyseus is TCP; unreliable-redundant-snapshot schemes don't apply and TCP will HOL-block anyway. On LAN it's a non-issue; don't build machinery you can't use.
- **Adding full lag compensation on day one for a LAN game.** WHY: premature — latency is ~ms and the shared interp delay dominates; complexity and the "shot behind cover" unfairness aren't worth it until real latency and hitscan weapons demand it.

---

## References

- Gabriel Gambetta — *Fast-Paced Multiplayer* (verified 2026-08-06):
  - Client-Server Game Architecture — https://www.gabrielgambetta.com/client-server-game-architecture.html
  - Client-Side Prediction and Server Reconciliation — https://www.gabrielgambetta.com/client-side-prediction-server-reconciliation.html
  - Entity Interpolation — https://www.gabrielgambetta.com/entity-interpolation.html
  - Lag Compensation — https://www.gabrielgambetta.com/lag-compensation.html
- Valve — *Source Multiplayer Networking* — https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking (content verified via mirror https://gist.github.com/CoolOppo/fe0586836de3fb2f90f9, 2026-08-06; canonical wiki 403s to automated fetch). Related: *Lag Compensation*, *Latency Compensating Methods in Client/Server In-game Protocol Design and Optimization* (Yahn Bernier).
- Glenn Fiedler / Gaffer On Games (verified 2026-08-06):
  - Snapshot Interpolation — https://gafferongames.com/post/snapshot_interpolation/
  - Fix Your Timestep! — https://gafferongames.com/post/fix_your_timestep/
  - (see also: Networked Physics, Deterministic Lockstep, Snapshot Compression)
- Colyseus — Room API (`patchRate` default 50ms/20Hz, `setSimulationInterval`) — https://docs.colyseus.io/server/room (verified 2026-08-06)
