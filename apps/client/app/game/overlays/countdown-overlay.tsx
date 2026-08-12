// Big centred countdown: ceil(seconds), or "GO" as it hits zero. Ships + picks are frozen the whole time
// (the server integrates nothing during countdown), so this is pure prep signalling.
export function CountdownOverlay( { seconds }: { seconds: number } ) {
    const n = Math.ceil( seconds );
    return (
        <div className="pointer-events-none fixed inset-0 z-[25] grid place-items-center">
            <span className="font-mono text-[140px] font-black leading-none text-cyan [text-shadow:0_0_40px_rgba(0,229,255,0.8),0_0_12px_#fff]">
                { n > 0 ? n : 'GO' }
            </span>
        </div>
    );
}
