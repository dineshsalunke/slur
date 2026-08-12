// The ambient backdrop scrim over the fixed live-3D Canvas (was `.scrim`): a centre-clear vignette + a
// top/bottom fade so the front-of-house UI stays legible against the moving scene. Pure decoration — it never
// intercepts pointer events (clicks fall through to the canvas), and sits at z-1, above the canvas, below the
// stage UI (z-2). The five-stop gradient itself is the `scrim` @utility in app.css, so its colour stops
// derive from the --color-void token instead of five raw rgbas inlined here.
export function Scrim() {
    return <div className="scrim pointer-events-none fixed inset-0 z-[1]" />;
}
