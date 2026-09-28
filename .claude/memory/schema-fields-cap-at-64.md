---
name: schema-fields-cap-at-64
description: "@colyseus/schema 4.0.30 caps a Schema class at 64 fields; defineTypes/schema() add fields in call order; PlayerState had 39 on 2026-09-28"
metadata:
  node_type: memory
  type: project
  originSessionId: 37700c16-63ca-4985-a595-1c5c60d9c91b
  modified: 2026-09-28T16:44:44.716Z
---

@colyseus/schema 4.0.30 throws when a Schema class passes 64 fields: `src/Metadata.ts:73`, *"Schema instances may only have up to 64 fields."* On 2026-09-28 `PlayerState` had 39 `@type` fields, so every future feature shares the 25 that are left.

Fields can be declared at run time. `defineTypes(Class, fields)` (`build/annotations.d.ts:76`) calls `type()` once per field, in order. The field index is the next free slot (`Metadata.ts:202–206`), so the order of the calls is the wire order. `schema({...})` (`:108`) builds a class from one object and infers its instance type.

**Why:** the client decodes by reflection, with no root class (see [[deprecated-breaks-reflection-decoding]]). So only the server's order matters. But a field added through an import side effect can move silently.

**How to apply:** before you add ship fields, count the `@type` fields in `PlayerState`. Keep sim-read ship fields flat, because `SIM_SHIP_KEYS` / `SIM_FLOAT_KEYS` copy them flat. If you compose fields, use one visible spread list, never boot-order `defineTypes` calls.
