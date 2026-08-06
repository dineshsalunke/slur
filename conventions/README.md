# Conventions

Source-verified idioms, best practices, anti-patterns, version pins, and footguns for each part of the SLUR
stack. These are the **distilled research** — the point is to **not re-derive the stack from memory** (memory
is frequently wrong about these exact APIs and versions).

> **Read-before-touching rule** (see `../CLAUDE.md`): before writing or changing code in a subsystem, read
> its file below. Read the *one* you need — don't bulk-load all six.

All files verified against official docs + `npm view` on **2026-08-06**. Each has the same shape:
TL;DR → Idiomatic Patterns → Best Practices → Anti-Patterns (with WHY) → Gotchas → For This Project → References.

| File | Subsystem | Headline decision / pin |
|------|-----------|-------------------------|
| [colyseus.md](./colyseus.md) | Multiplayer server, rooms, state sync | Colyseus 0.17; client = `@colyseus/sdk` (not `colyseus.js`); `getStateCallbacks` pattern |
| [react-router.md](./react-router.md) | Client routing / app shell | RR **8** data mode; import from `react-router`; persistent Canvas in layout route; `useBlocker` for mid-match nav |
| [r3f.md](./r3f.md) | Rendering, VFX, bloom | R3F 9 + drei + postprocessing; **pin `three@0.185.x`**; HDR emissive + single global Bloom; brometal = TS→WGSL shader compiler (experimental) |
| [ecs.md](./ecs.md) | Entities & systems | **koota** (over miniplex/bitECS); no-re-render R3F bridge; `reconcile()` from Colyseus |
| [netcode.md](./netcode.md) | Real-time networking | Inputs-not-positions; shared 60Hz `simulate()`; 20Hz `patchRate`; server-authoritative hits; LAN baseline (defer lag-comp) |
| [monorepo.md](./monorepo.md) | pnpm workspace, builds | 3 packages only; `shared` is `tsc`-compiled (schema decorators); catalog for version pins; no Turborepo yet |

## Maintenance

- When a pinned version or an API changes, **update the relevant file** (and the pin tables in `CLAUDE.md`).
- Keep the "verified" date current when you re-verify.
- These are stack-general idioms; **project-specific** design/decisions live in `../docs/`.
