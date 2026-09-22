---
name: shared-tunables-storage
description: "The tuning panel's localStorage is shared between the owner's window and the extension tab — agree who drives before A/B testing"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: e5d74fce-6c51-496f-8050-309f116acb94
  modified: 2026-09-22T18:58:59.622Z
---

`localStorage['slur.tuning.v1']` is one store shared by the owner's browser window and the
Claude-driven extension tab. During a re-dial both sides were writing it: `tone.exposure` moved from
1 to 3 under the agent mid-A/B, and the chain had to be restarted.

**A scene-look verdict reached on the shared origin is worthless while another session has the
knobs — and you will not notice.** 2026-09-23, judging the new asteroid bands on `:5173`: the rock
read as flat black silhouette, blamed first on rig issue #170, then on three stale `Fog.*`
overrides. Neither was ever established. Across three reloads the same nominal config produced dark
rock once and a washed-out pale scene once, because `hud` was dialling exhaust knobs into the same
store between reloads — `Exhaust.idle` and `EngineLight.intensity` appeared as live overrides
mid-session, absent from the same diff minutes earlier. A retraction was published and a commit
message amended on an A/B that could not be read either way. **Do not reason from reload-to-reload
screenshots on a shared origin. Take a worktree on its own `CLIENT_PORT`** — a separate origin with
its own empty store — which is what the per-ORIGIN paragraph below is for.

Liveness is decidable from source, and worth checking before blaming anything on a stale key.
`restore()` in `apps/client/app/dev/tuning-persist.ts` is:

```ts
if ( ! entry || entry.from !== fallback ) return fallback;
return entry.value as T;
```

An entry applies iff its `from` equals the **current schema default** in `dev/tuning-schema.ts` —
not whatever the default was when it was written. So a populated store proves nothing, and neither
does a `value` that differs from its own `from`. Compare `from` against the schema:

```js
const s = JSON.parse( localStorage.getItem( 'slur.tuning.v1' ) );
Object.entries( s ).map( ( [ k, e ] ) => [ k, e.value, e.from ] );
```

A commit that moves a default silently kills every entry persisted before it, since their `from` no
longer matches — `03a28c8` did exactly that to `Fog.near` 60→40, `Fog.far` 500→420 and `Fog.color`
`#070a10`→`BACKDROP_HORIZON`.

**Why:** an A/B is only readable if exactly one hand is on the knobs. A value that changes for an
unseen reason gets attributed to the change under test, and the conclusion is wrong.

**How to apply:** before starting A/Bs, ask who drives and say it out loud. Read the store rather
than trusting an in-memory value, announce each write, and restore anything touched that wasn't the
subject of the test. `reset` is not an undo — it restores every key to spec default and has already
destroyed a full set of hand-dialled numbers once. Land dialled values into `NUMBER_SPECS`, or at
minimum write them into a phase note, before any session that might reset.

**The sharing is per-ORIGIN, and a worktree on its own port is a different origin.** A second dev
stack on `:5175` (per `apps/client/.env.example`) has an entirely separate
`localStorage['slur.tuning.v1']` from the owner's `:5173` — it cannot read, clobber or restore the
owner's dialled set, and it starts from spec defaults. That is the safe way to A/B without
coordinating: take a worktree with its own `CLIENT_PORT` rather than negotiating for the knobs. It
also means a new knob's source default is what you actually see there, whereas on a store that has
ever been written, `restore()` only overwrites keys present in the saved object — so an existing
key's changed source default stays invisible until the store is cleared.

Related: [[leave-the-browser-tab-open]], [[browser-extension-throttles-fps]],
[[worktrees-are-for-concurrency]].
