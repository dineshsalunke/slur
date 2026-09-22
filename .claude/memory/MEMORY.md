# Project memory — slur

Index of durable facts for this repo. One line per memory; the memory itself
lives in its own file beside this one.

- [Worktrees are for concurrency](worktrees-are-for-concurrency.md) — use one only when work actually collides, never as ceremony for a small change
- [Project memory lives in the repo](project-memory-in-repo.md) — `.claude/memory/`, git-tracked, set via `autoMemoryDirectory`
- [Backlog is split two ways](backlog-split.md) — global = parking lot, project file = the SLUR roadmap
- [Instanced meshes hide scene bugs](instanced-meshes-hide-scene-bugs.md) — a traversal that skips `InstancedMesh` cannot prove a stray object isn't there; audit instance matrices
- [Leave the browser tab open](leave-the-browser-tab-open.md) — closing it closes the window; reuse the `/test-level` tab
- [Extension FPS readings are worthless](browser-extension-throttles-fps.md) — the driven tab is backgrounded and rAF is throttled; CPU-per-frame is still trustworthy
