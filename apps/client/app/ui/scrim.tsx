// The ambient backdrop scrim over the fixed live-3D Canvas (was `.scrim`): a centre-clear vignette + a
// top/bottom fade so the front-of-house UI stays legible against the moving scene. Pure decoration — it never
// intercepts pointer events (clicks fall through to the canvas), and sits at z-1, above the canvas, below the
// stage UI (z-2).
export function Scrim() {
    return (
        <div className="pointer-events-none fixed inset-0 z-[1] bg-[radial-gradient(120%_90%_at_50%_8%,transparent_40%,rgba(5,6,10,0.55)_100%),linear-gradient(180deg,rgba(5,6,10,0.72)_0%,transparent_22%,transparent_60%,rgba(5,6,10,0.4)_100%)]" />
    );
}
