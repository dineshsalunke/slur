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
