---
name: tuning-over-cdp
description: "Driving the tuning store for an A/B: importing the live tuning.ts module over CDP is bit-identical but only before that module's first HMR update, after which the import resolves to an orphan instance that silently does nothing — write slur.tuning.v1 into a fresh headless profile's localStorage instead, and remember the store is shared per origin with every other tab and with the owner's window"
metadata:
  node_type: memory
  type: feedback
  originSessionId: d6ebc3ab-36ec-4063-9ee5-e104e67ccc37
  modified: 2026-09-29T04:05:24.492Z
---

### Drive the live module, do not reload

To A/B a tunable, do **not** reload with a `localStorage` override. Every lighting tunable is
`rebuild: false` and is read each frame by `useFrame`, and `setNum` is a live module export
(`apps/client/app/dev/tuning.ts`). Vite dev dedupes modules by URL, so the page can import its own
live graph over CDP:

```
node cdp.mjs "(async () => { const t = await import('/app/dev/tuning.ts');
  t.setNum('Fill.intensity', 2); })()"
```

Every frame in the sweep is then **bit-identical except the light**. Measured **SSIM 0.99992** run
to run — against 0.906 for a timed flight and 0.995 for the spawn-pose fix in [[freeze-the-sim]].
Drift stops being something to manage.

**Why:** a reload re-runs `restore()`, re-converges `<Environment frames={Infinity}>` and re-lands
the camera somewhere slightly different. None of that is needed to change a number the render loop
re-reads anyway.

**How to apply:**
- **A dynamic `import()` can get a DIFFERENT module instance.** `/app/game/ecs/traits.ts` and
  `/app/game/ecs/traits.ts?t=1790136001058` are two modules with two different `trait()` objects,
  so `world.query(tr.Sim)` silently returns **empty**. Read the URL the app actually loaded out of
  `performance.getEntriesByType('resource')` and import that exact string, HMR timestamp and all.
- **Writing `Sim` under `KeyP` freeze does nothing visible** — `LocalLoop` skips `syncRenderSystem`
  while frozen. Set `Sim` *and* `Prev`, unfreeze ~0.9s, re-freeze. That gives arbitrary camera
  placement: resolve the descriptor in-page off
  `/@fs/.../packages/shared/dist/index.js`, walk `segmentAt(i).blocks`, teleport 40u behind one.
  Needed because `/test-level`'s spawn pose has no sealed block near the camera at all.
- Restore with `forget()` from `tuning-persist.ts` **and** set the touched tunables back to their
  schema defaults — `forget()` clears storage but not the in-memory values.

Related: [[headless-game-tabs-starve-the-gpu]], [[probe-by-feature-not-by-pixel]].

**Caveat (2026-09-23):** only safe BEFORE the first HMR update of that module — after one, the import
resolves to an orphan instance and the page never sees the change.

### CDP import of tuning hits an HMR orphan

Driving the tuning store over CDP with `import('/app/dev/tuning.ts')` **silently does nothing to the
page** once Vite has hot-reloaded anything. HMR serves the module as `/app/dev/tuning.ts?t=<ts>`, a
different URL, so the import resolves to a **second instance** with its own `numbers`/`colors` maps.
`setNum`/`setCol` mutate the orphan; the live scene keeps its old values.

**Why:** it fails silently and *looks* like it worked — the call returns the new value when you read
it back through the same orphan. This burned a whole session: forcing a shadow blob to pure green
produced zero green pixels, which read as "the feature is broken" when the feature was fine and the
blob was simply still its default near-black. Two peer agents then debugged a bug that did not exist.

It also leaks: the orphan's `remember()` still writes through to the shared `slur.tuning.v1`
localStorage key, so debug values reach every tab on the origin at its next reload.

**How to apply:** to force a value for a visual test, do not go through the tuning module. Park the
object on `window` inside its `useFrame` and pin the uniform against the per-frame overwrite:
`u.uColor.value.setRGB(0,1,0); u.uColor.value.set = () => u.uColor.value;` and an
`Object.defineProperty(u.uOpacity, 'value', { get: () => 1, set: () => {} })`. Afterwards, purge the
`Shadow.*`-style keys you touched out of `slur.tuning.v1`. Supersedes the unqualified "drive the live
module" advice above, which is only safe before the first HMR update of that module.

### Tune headless captures via their own localStorage

To capture tuning variants (lights, colours, chase camera) on the owner's live stack, do not call
`setNum`/`setCol` over CDP. Navigate the headless tab to any same-origin URL (for example
`/favicon.ico`). Write `localStorage['slur.tuning.v1']` as `{ "<key>": { "value": v, "from": <current default> } }`,
then navigate to `/test-level`. `restore()` ignores an entry whose `from` does not equal the current
schema default, so `from` must match the value that is in `tuning-schema.ts` now.

**Why:** the headless Chrome has its own `--user-data-dir`, so its localStorage never reaches the
owner's browser. A fresh page load has no HMR module instance, so the CDP-import orphan problem
above cannot occur. Used for #258 (5 variants on one Chrome, 2026-09-25).

**How to apply:** use one Chrome and reload per variant. Add `Page.addScriptToEvaluateOnNewDocument` for a
draw-call hook ([[gpu-timing-without-repo-edits]]). After you change a default in the
schema, update `from` in your script too. A stale `from` drops the variant with no error, and the A/B
reads identical (#359, 2026-09-29: pool hue 37.1 = 37.1 until `from` was fixed). Kill Chrome by PID afterwards
([[kill-by-pid-never-pkill]]).

### The tunables store is shared

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

Related: [[extension-tab]], [[one-stack-dev-only]].
