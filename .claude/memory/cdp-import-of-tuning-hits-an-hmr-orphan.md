---
name: cdp-import-of-tuning-hits-an-hmr-orphan
description: "import('/app/dev/tuning.ts') over CDP resolves to a second HMR module instance, so setNum/setCol never reach the page"
metadata: 
  node_type: memory
  type: feedback
  originSessionId: c4aee720-5af9-46db-8e98-cf73d0c20042
  modified: 2026-09-23T10:05:47.600Z
---

Driving the tuning store over CDP with `import('/app/dev/tuning.ts')` **silently does nothing to the
page** once Vite has hot-reloaded anything. HMR serves the module as `/app/dev/tuning.ts?t=<ts>`, a
different URL, so the import resolves to a **second instance** with its own `numbers`/`colors` maps.
`setNum`/`setCol` mutate the orphan; the live scene keeps its old values.

**Why:** it fails silently and *looks* like it worked — the call returns the new value when you read
it back through the same orphan. This burned a whole session: forcing a shadow blob to pure green
produced zero green pixels, which read as "the feature is broken" when the feature was fine and the
blob was simply still its default near-black. Two peer agents then debugged a bug that did not exist.

It also leaks: the orphan's `remember()` still writes through to the shared `slur.tuning.v1`
localStorage key, so debug values reach every tab on the origin at its next reload — see
[[shared-tunables-storage]].

**How to apply:** to force a value for a visual test, do not go through the tuning module. Park the
object on `window` inside its `useFrame` and pin the uniform against the per-frame overwrite:
`u.uColor.value.setRGB(0,1,0); u.uColor.value.set = () => u.uColor.value;` and an
`Object.defineProperty(u.uOpacity, 'value', { get: () => 1, set: () => {} })`. Afterwards, purge the
`Shadow.*`-style keys you touched out of `slur.tuning.v1`. Supersedes the unqualified advice in
[[drive-the-live-module-not-a-reload]], which is only safe before the first HMR update of that module.
