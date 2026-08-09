// Big centred countdown: ceil(seconds), or "GO" as it hits zero. Ships + picks are frozen the whole time
// (the server integrates nothing during countdown), so this is pure prep signalling.
export function CountdownOverlay( { seconds }: { seconds: number } ) {
    const n = Math.ceil( seconds );
    return (
        <div className="slur-countdown">
            <span className="slur-count-num">{ n > 0 ? n : 'GO' }</span>
        </div>
    );
}
