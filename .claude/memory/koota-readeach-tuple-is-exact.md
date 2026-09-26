---
name: koota-readeach-tuple-is-exact
description: A hoisted koota readEach callback needs a rest element in its tuple type; readEach allocates its state array per call anyway
metadata:
  node_type: memory
  type: reference
  originSessionId: 38036c82-ecc2-4467-bf9b-96b74a770971
  modified: 2026-09-26T08:23:19.014Z
---

koota 0.6.6 `readEach( cb )` passes `state` typed as the full tuple of queried traits. A callback typed
`( [ a, b ]: [ A, B ] )` fails for a three-trait query (TS2345), because tuple types are exact-length. Type it
`[ A, B, ...unknown[] ]`.

`readEach` itself builds one `Array.from( { length: traits.length } )` per call
(`node_modules/koota/dist/chunk-*.js`, `readEach(callback)`). Hoisting the callback removes one closure a frame,
not all allocation. Keep the per-frame values in a scratch object or in closure `let`s inside a `useMemo`.

Related: [[ast-grep-drops-semicolons]].
