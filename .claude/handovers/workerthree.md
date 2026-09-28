Agent: workerthree · Lane: #344 perf on phones + low-end laptops · Updated: 2026-09-28 (seam after P1)

## Goal
The menu must be usable on an iPhone 12/15 and an OEM Windows laptop. Stable 60 fps on iPhone 15, and ≥30 fps on an integrated-GPU laptop in a race. The owner approved P1 (a–f) and P2 (quality tier, auto MSAA on high only).

## Done
- 5ecbc6c P1: quality tier module (`apps/client/app/quality/`), non-blocking lobby join, root HydrateFallback, LandingBackdrop (lazy 3D, or still backdrop on low / ?nocanvas / no WebGL2 / context lost), surface maps 512 on low+medium, sky bake 512 on low+medium, noise volume 32³ on low, preload only the chosen ship (roster preloaded in the game loader), checkShaderErrors off in prod on the landing. Pushed to origin/dev.
- Diagnosis sent to supervisor earlier (measured numbers are in that message and in the 5ecbc6c body).

## State
- 6x CPU, dev stack, menu visible: low ≈2.0 s with 0 ms of long tasks after; medium ≈2.5 s, 2.7 s of long tasks after, longest 0.67 s; high ≈2.6 s, 3.8 s after, longest 1.1 s. Before: first draw 8.2 s.
- M3, 1366x768 DPR 1 landing: 6.6 ms with auto MSAA 4, 3.5 ms with Render.msaa=0 (measured before P1).
- SwiftShader: the page froze (7.9 s first frame, ~650 ms per frame). P1 sends software GL to low (no canvas) [unmeasured after the change].
- do-setup turned on brotli and gzip on prod: JS 1.22 MB → 305 KB; ship gltf 20.5 → 15.2 MB (supervisor relay).
- `pnpm lint` passes (warnings only), client tests 624/624, typecheck passes, the client build puts the still backdrop in index.html.
- The iPhone (WebKit) is not measured; the owner's device test is pending.

## Uncommitted
none

## Held files (claimed, cleared by supervisor)
app/quality/*, routes/home.tsx, root.tsx, routes/home/landing-*/*, ui/still-backdrop.tsx, app.css (still-space), game/scene/{canvas-gl,track-texture,nebula-baker,nebula-noise-volume}.ts, game/scene/ship-model/*, routes/game/route.tsx. For P2 also: game/net-canvas.tsx, game/scene/scene-effects/*, game/scene/world-scene.tsx, game/scene/rear-view*.tsx, game/scene/rock-field/*, routes/test-level/test-level-canvas/*, the menu strip (quality picker).

## Next
1. Send the supervisor the device flags for the owner: `?quality=low|medium|high`, `?nocanvas`; the laptop reports the chrome://gpu GL_RENDERER line. Needs a deploy of 5ecbc6c. Ask do-setup or the supervisor.
2. P2 in-race tier, as a separate commit. Add fields to PROFILES:
   - `dprCap` (high 2, medium 1.5, low 1). Set `dpr={[1, cap]}` on NetCanvas, LandingScene and TestLevelCanvas.
   - `msaa`: `msaaSamples()` in scene-effects.utils returns 0 unless the tier is high (the manual Render.msaa still wins).
   - `post`: low skips the EffectComposer (the renderer tone-maps via CANVAS_GL).
   - `skyMotion`: low freezes the uTime flow.
   - `rocks`: low hides the RockField.
   - `rearView`: low skips it.
   Runtime step-down from a measured median frame time on addEffect (weigh ≥5 options, NN-13). A manual picker in the menu strip calls setQualityTier; the texture and bake sizes apply on reload.
3. Measure P2 with scratch landing.mjs / perf.mjs (scratchpad of session 1ea840a1): laptop DPR 1, iPhone 390x844@3.
4. Close #344 with the P2 SHA, or comment the P1 SHA and keep it open if the owner still has to sign off.
5. Separate item after P1, not to build here: network lag in a race (prediction and reconciliation India→blr1). Also 4 failed wss reconnects (skipHandshake) seen once on prod.

## Open questions
- compileAsync before the first landing frame: the env map is set in useFrame, so a pre-frame compile would build the wrong variants. Worth a design?
- The glb + meshopt conversion of the ship models: the supervisor is asking the owner.

## Lessons → memory
.claude/memory/time-hot-loops-in-chrome-not-tsx.md (committed in 5ecbc6c)
