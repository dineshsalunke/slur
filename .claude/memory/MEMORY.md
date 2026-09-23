# Project memory — slur

Index of durable facts for this repo. One line per memory; the memory itself
lives in its own file beside this one.

- [Worktrees are for concurrency](worktrees-are-for-concurrency.md) — use one only when work actually collides, never as ceremony for a small change
- [Project memory lives in the repo](project-memory-in-repo.md) — `.claude/memory/`, git-tracked, set via `autoMemoryDirectory`
- [Backlog is split two ways](backlog-split.md) — global = parking lot, project file = the SLUR roadmap
- [Instanced meshes hide scene bugs](instanced-meshes-hide-scene-bugs.md) — a traversal that skips `InstancedMesh` cannot prove a stray object isn't there; audit instance matrices
- [Leave the browser tab open](leave-the-browser-tab-open.md) — closing it closes the window; reuse the `/test-level` tab
- [Extension FPS readings are worthless](browser-extension-throttles-fps.md) — the driven tab is backgrounded and rAF is throttled; CPU-per-frame is still trustworthy
- [The tunables store is shared](shared-tunables-storage.md) — one `localStorage` per ORIGIN; a worktree on its own port sidesteps it entirely
- [One git index per checkout](shared-checkout-shares-one-git-index.md) — `git add` is not session-local; commit with explicit pathspecs
- [Blocks are the only streamed geometry](blocks-are-the-only-streamed-geometry.md) — everything else is built once over the whole track; suspect `BACK` when blocks vanish from a non-chase view
- [Claim the lane before the first write](claim-the-lane-before-the-first-write.md) — a handover's "Left undone" list is a shared queue; two sessions took the same item and one lost untracked files
- [Headless Chrome for frame taps](headless-chrome-for-frame-taps.md) — drive a separate headless Chrome and curl `/__frame-tap`; never screenshot the extension tab
- [Eyeballing a tap lies about brightness](eyeballing-a-tap-lies-about-brightness.md) — the deck measures rgb(28) and looks mid-grey; composite a grey ramp before judging value
- [Freeze the sim to A/B a light](freeze-the-sim-to-ab-a-light.md) — KeyP holds the camera, but freeze at the SPAWN pose; a timed flight drifts (SSIM 0.906)
- [Probe by feature, not by pixel](probe-by-feature-not-by-pixel.md) — find the surface from its own emissive each frame; the bright deck line is the rim cord, not the rail
- [Monoliths are metal now](monoliths-are-metal-now.md) — moved onto the block texture, softening a named hazard/scenery readability split; owner-accepted, re-gate still unrun
- [Drive the live module, do not reload](drive-the-live-module-not-a-reload.md) — import the page's own module over CDP and call `setNum`; the camera never moves between A/B frames
- [Freeze does not stop asteroid drift](freeze-does-not-stop-asteroid-drift.md) — a two-tap diff is contaminated frame-wide; for presence, force an alien colour and scan one tap
- [CDP import of tuning hits an HMR orphan](cdp-import-of-tuning-hits-an-hmr-orphan.md) — setNum/setCol silently reach a second module instance, not the page; pin uniforms instead
- [Frame tap may answer from another tab](frame-tap-may-answer-from-another-tab.md) — screenshot the tab you drive over CDP when the reading must match state you just set
- [Pane percent is of 1M](pane-percent-is-of-one-million.md) — 15% on a worker's bar is the 150k warning; clear before assigning past 10%
- [Supervisor clears workers via herdr](supervisor-clears-workers-via-herdr.md) — `herdr agent prompt <pane> "/clear"`, then a resume prompt; "stalled" on /clear is success
- [Rear-view panel looks like geometry](rear-view-panel-looks-like-geometry.md) — the top-centre translucent slab in a /test-level tap is the mirror, not a lintel
- [Headless game tabs starve the GPU](headless-game-tabs-starve-the-gpu.md) — one extra game tab doubles frame time; DPR 1, mute, kill after use
- [koota universe reaches the page world](koota-universe-reaches-the-page-world.md) — `universe.worlds` over CDP finds the ship; stage seekers in `localCombat.seekers` while frozen
- [Measure a homing rule on procgen](measure-a-homing-rule-on-procgen.md) — 30 seeds + a block-avoiding bot + per-phase death log; unit tests missed two collision artifacts
- [Fog hides emissive past 420u](fog-hides-emissive-past-420u.md) — linear fog 40–420u swallows glow; far signals need `fog:false`; camera far 1000u is the cap
- [Instanced ref fill needs a geometry prop](instanced-ref-callback-needs-geometry-prop.md) — a JSX geometry child attaches after the ref callback; pass a module-level geometry
- [procgen segmentAt is uncached](procgen-segmentat-is-uncached.md) — every call rebuilds the segment; memoise the track in a brute-force test (26.8 s → 0.26 s)
- [Place the ship over CDP](place-the-ship-over-cdp.md) — import the live world, write Sim x/z, freeze; first /test-level fractured block is id 3392 at z 1064
- [Step the R3F clock for timed taps](step-the-r3f-clock-for-timed-taps.md) — frameloop 'never' + `advance(t)` gives exact VFX ages; import the page's `?t=` module URLs
- [@deprecated breaks reflection decoding](deprecated-breaks-reflection-decoding.md) — the client decodes by reflection; a deprecated field shifts later indexes. Keep dead fields plain
- [Drive a hosted room over CDP](drive-a-hosted-room-over-cdp.md) — session.room + a gap-aware bot; races stop at 180 s; reverse through a pickup for a duplicate
- [Thin emissive needs pixel coverage](thin-emissive-needs-pixel-coverage.md) — bloom follows lit-pixel area; an edge-on 0.25u strip is 1 px and barely blooms even at lum 0.85
