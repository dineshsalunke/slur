# Project memory — slur

One line per memory, grouped by topic. Keep each hook under ~70 characters.

## Owner rules & team process
- [One stack, dev only](one-stack-dev-only.md) — no worktrees or second stacks; :5173/:2567
- [Owner tests on /test-level](owner-tests-on-test-level.md) — brief and verify every change there
- [Worker closes its issue](worker-closes-its-issue.md) — fixer runs `gh issue close` with the SHA
- [Owner may waive issue filing](owner-may-waive-issue-filing.md) — "no issue, go ahead" = build without
- [Summarise issues when asking](summarise-issues-when-asking-the-owner.md) — title + one line, never bare #n
- [Obstacle spacing from ship physics](obstacle-spacing-from-ship-physics.md) — pitch = reaction+cross+settle+hull
- [Claim the lane before the first write](claim-the-lane-before-the-first-write.md) — unclaimed item lost files
- [Shared tree footguns](shared-tree-footguns.md) — one index; pathspec skips untracked; peers' HMR
- [Merge PRs in a detached worktree](merge-prs-in-a-detached-worktree.md) — `push HEAD:dev`; needs owner OK now
- [Supervisor drives workers via herdr](supervisor-clears-workers-via-herdr.md) — clear/resume; % of 1M; prompt, not keys
- [Project memory lives in the repo](project-memory-in-repo.md) — `.claude/memory/` via autoMemoryDirectory
- [Backlog is split two ways](backlog-split.md) — global parking lot vs project roadmap

## Shell, tools & machine
- [Bash tool shell varies](bash-tool-runs-fish.md) — fish or zsh; use `&&` and `bash -c`
- [Kill by PID, never pkill](kill-by-pid-never-pkill.md) — BSD pkill hit the owner's apps
- [Bulk move without git mv](bulk-move-without-git-mv.md) — scripted `git mv` denied; node fs
- [ast-grep footguns](ast-grep-footguns.md) — trailing comma, dropped `;`, type patterns need context
- [Lint footguns](lint-footguns.md) — Biome class sort + stdin; ls-lint sub-exts; useEffect ratchet
- [Typegen runs in production mode](typegen-runs-in-production-mode.md) — dev-gated routes lose `+types`
- [Shared watcher can leave dist stale](shared-watcher-can-leave-dist-stale.md) — `tsc -b --force`
- [Shared tests need an in-package outDir](shared-tests-need-in-package-outdir.md) — use `pnpm test`
- [Share a vi.mock through a dynamic import](share-a-vi-mock-through-a-dynamic-import.md) — `await import(h)`
- [Aim tests need a clear approach](aim-tests-need-a-clear-approach.md) — seed Math.random; whole file
- [Fixtures must be width-relative](fixtures-must-be-width-relative.md) — `HALF_WIDTH - n`, no literal ±32
- [Time hot loops in Chrome, not tsx](time-hot-loops-in-chrome-not-tsx.md) — tsx reads 15x slow
- [Scribd needs headless Chrome](scribd-needs-headless-chrome.md) — Playwright + system Chrome
- [Quit Docker Desktop via its CLI](quit-docker-desktop-via-cli.md) — `docker desktop stop`
- [kurmah DO infra](kurmah-netbird-infra.md) — droplets `netbird` + `slur` (/opt/slur); kurmah_ed25519

## Headless Chrome & CDP driving
- [Headless Chrome practice](headless-game-tabs-starve-the-gpu.md) — DPR 1, mute, kill; frame taps; viewport; 2 Chromes
- [Extension tab](extension-tab.md) — never close it; its FPS readings are throttled
- [Check the CDP port is yours](check-the-cdp-port-is-yours.md) — taken port fails silently
- [Leave guard blocks CDP navigate](leave-guard-blocks-cdp-navigate.md) — beforeunload; fresh tab per run
- [Frame tap may answer from another tab](frame-tap-may-answer-from-another-tab.md) — screenshot your tab
- [Tuning over CDP](tuning-over-cdp.md) — live module setNum; HMR orphan; per-origin localStorage
- [Preview a constant by route rewrite](preview-a-constant-by-route-rewrite.md) — Playwright page.route
- [Live HMR sees half-applied edits](live-hmr-sees-half-applied-edits.md) — providers first, leaf-first
- [Timed taps](timed-taps.md) — frameloop never + advance(t); fake performance.now; toDataURL
- [Freeze the sim](freeze-the-sim.md) — KeyP at SPAWN; asteroids still drift
- [Zoom the chase camera over CDP](zoom-the-chase-camera-over-cdp.md) — defineProperty fov getter
- [Wheel clientX is an integer](wheel-event-clientx-is-integer.md) — whole pixels; onWheel passive
- [Touch test over CDP](touch-test-over-cdp.md) — `pointer: coarse`; sample ≥300 ms after tap
- [Test-level skips Overlays](test-level-skips-overlays.md) — in-race HUD goes in NetHud
- [Count React renders over CDP](count-react-renders-over-cdp.md) — fake devtools hook
- [Grab the scene](grab-the-scene.md) — three devtools hook; wrap Object3D onBeforeRender
- [koota universe reaches the page world](koota-universe-reaches-the-page-world.md) — reads ok; writes lost
- [Decode audio in headless Chrome](decode-audio-in-headless-chrome.md) — decodeAudioData over CDP
- [Drive /beat-deck headless](drive-beat-deck-headless.md) — setFileInputFiles; `data-phase`

## Rooms, bots & netcode testing
- [Drive a hosted room over CDP](drive-a-hosted-room-over-cdp.md) — session.room + gap-aware bot
- [Place the ship over CDP](place-the-ship-over-cdp.md) — write `room.sim.state` x/z unfrozen
- [Step the loopback room by hand](step-the-loopback-room-by-hand.md) — room.step + send + ?start=
- [Stage a mine on /test-level](stage-a-mine-on-test-level.md) — server `slots[0] = 3` + KeyE
- [Node bots](node-bots.md) — node @colyseus/sdk second racer; one event loop per busy bot
- [Scratch servers](scratch-servers.md) — `__finish` seeds racers; 30-segment short course
- [Simulate a room drop over CDP](simulate-a-room-drop-over-cdp.md) — `connection.close(4010)` after 5 s
- [SDK buffers sends while dropped](sdk-buffers-sends-while-dropped.md) — flushed on reconnect
- [Unmounted fetcher drops its redirect](unmounted-fetcher-drops-its-redirect.md) — store on non-redirect path
- [Server rounds floats each tick](fround-makes-float-asserts-fail.md) — assert `Math.fround`; SIM_FLOAT_KEYS
- [@deprecated breaks reflection decoding](deprecated-breaks-reflection-decoding.md) — keep dead fields plain
- [Schema fields cap at 64](schema-fields-cap-at-64.md) — PlayerState 39/64; order = wire order
- [Short bolts skip the patch](short-bolts-skip-the-patch.md) — hit within ~45 u: client sees only HIT

## Sim, track & pilots
- [Sim ship y is 0 on the deck](sim-ship-y-is-zero-on-deck.md) — hover is client-only
- [tuningForShip takes a ship id](tuningforship-takes-a-ship-id.md) — use `SHIP_CLASSES.<c>.tuning`
- [Test-level dials miss the predictor](test-level-dials-miss-the-predictor.md) — tunedSimConfig server-only
- [Strafe kick re-contacts every tick](strafe-kick-recontacts-every-tick.md) — charge fresh contacts only
- [Procgen seed 0 reads as unset](procgen-seed-zero-reads-as-unset.md) — seeds ≥ 1
- [procgen segmentAt is uncached](procgen-segmentat-is-uncached.md) — memoise in brute-force tests
- [Phrase length is per seed](phrase-length-is-per-seed.md) — phraseSegments(seed), not 600
- [Pacing grid ignores ship length](pacing-grid-ignores-ship-length.md) — grow blocks by halfW/halfL
- [Band width is the weave speed dial](band-width-is-the-weave-speed-dial.md) — ≤16u band lifts long ships
- [Doors cannot force a 1-cell step](doors-cannot-force-a-one-cell-step.md) — one-sided pins, full holes
- [Fork choices can conflict](fork-choices-can-conflict.md) — bar softly; read `choice` off the path
- [Fractured blocks rarely have a clear lane](fractured-blocks-rarely-have-a-clear-lane.md) — reserve early
- [Open islands can wedge a ship](open-islands-can-wedge-a-ship.md) — thin post + rail corner
- [Easiest route moves early](easiest-route-moves-early.md) — pin the path at each note
- [Rate clamp is not flyability](rate-clamp-is-not-flyability.md) — fly paths with a sim pilot
- [Measure a homing rule on procgen](measure-a-homing-rule-on-procgen.md) — 30 seeds + avoiding bot
- [Sim pilot footguns](sim-pilot-footguns.md) — √-stop, dithers, dense check, run-up, kick, delay, lead
- [A sweep that hits its bound fakes a reading](a-sweep-that-hits-its-bound-fakes-a-reading.md) — test no-input
- [Song tracks (#253, throwaway)](song-tracks.md) — keeps tempo; freighter speed; triplet grid

## Rendering & React
- [useFrame order is subscribe time](useframe-order-is-subscribe-time.md) — mount order, not JSX order
- [Removing the composer blacks the canvas](removing-the-composer-blacks-the-canvas.md) — PlainRender prio 1
- [R3F disposes only the object](r3f-disposes-only-the-object.md) — free prop geometry in ref cleanup
- [InstancedMesh footguns](instanced-mesh-footguns.md) — geometry prop; shared buffers; bounds; audit
- [Blocks are the only streamed geometry](blocks-are-the-only-streamed-geometry.md) — suspect `BACK`
- [Block render cap drops silently](block-render-cap-drops-silently.md) — put() drops past its limit
- [Chained shader patches need a guard](chained-shader-patches-need-a-material-guard.md) — chainShaderPatch
- [Trapezoid quad varyings skew](trapezoid-quad-varyings-skew.md) — pass world-affine offsets
- [MSAA edge samples extrapolate varyings](msaa-edge-samples-extrapolate-varyings.md) — clamp; x*x not pow
- [Sub-pixel geometry drops out without AA](sub-pixel-geometry-drops-out-without-aa.md) — <1 px vanishes
- [React dev tracks walk typed-array props](react-dev-tracks-walk-typed-array-props.md) — use context
- [SVG polylines raster per tile](svg-polyline-raster-per-tile.md) — chunk long polylines
- [koota readEach tuple is exact](koota-readeach-tuple-is-exact.md) — `[ A, B, ...unknown[] ]`
- [leva onChange fires on mount](leva-onchange-fires-on-mount.md) — compare hex case-insensitively
- [Back-face flip mirrors a glyph](back-face-flip-mirrors-a-glyph.md) — rotateX(PI), not Y; test direction

## Look, light & materials
- [Scene env intensity overrides material](scene-env-intensity-overrides-material.md) — only Environment.intensity
- [Deck glare is the HDRI lobe](deck-glare-is-the-hdri-lobe.md) — rotate env before touching albedo
- [Anisotropy stretches the HDRI, not emissives](aniso-stretches-the-hdri-not-emissives.md) — white wash
- [Measure an HDRI offline in node](measure-an-hdri-offline-in-node.md) — HDRLoader in node
- [Raycast luma probe per surface](raycast-luma-probe-per-surface.md) — metal F0 0.07 darkens the track
- [Deck material on blocks and monoliths](deck-material-on-blocks-and-monoliths.md) — separation by form
- [Fog hides emissive past 420u](fog-hides-emissive-past-420u.md) — far signals need `fog:false`
- [Thin emissive needs pixel coverage](thin-emissive-needs-pixel-coverage.md) — edge-on strip barely blooms
- [A point light at an emitter shifts its hue](point-light-at-an-emitter-shifts-its-hue.md) — turned red
- [Nozzle colour is two GLB materials](nozzle-colour-lives-in-two-glb-materials.md) — tintNozzle; Exhaust.glow 0 to A/B
- [Cavity channel is dead](cavity-channel-is-dead.md) — darken the albedo map instead
- [Threshold noise makes worm pits](threshold-noise-makes-worm-pits.md) — use Worley distance
- [Round lobes read as spots](round-lobes-read-as-spots.md) — angle-random strokes + fBm

## Measuring pixels & perf
- [GPU timing without repo edits](gpu-timing-without-repo-edits.md) — draw calls; composer.render; readPixels sync
- [Measure a post effect by region change](measure-a-post-effect-by-region-change.md) — % px per region
- [Eyeballing a tap lies about brightness](eyeballing-a-tap-lies-about-brightness.md) — grey ramp
- [Probe by feature, not by pixel](probe-by-feature-not-by-pixel.md) — find surface by its emissive
- [A/B an old sim from git in scratch](ab-an-old-sim-from-git-in-scratch.md) — `git show` step.ts
- [Force quality=high in headless](force-quality-high-in-headless.md) — no override = no mirror/post (low tier); `?quality=high` + `slur:quality`
