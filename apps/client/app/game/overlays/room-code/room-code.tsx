export function RoomCode( { code }: { code: string } ) {
    return (
        <p className="m-0 flex h-8 items-center gap-3 border border-readout/20 bg-deep/85 px-3 text-[12px] uppercase tracking-[0.16em]">
            <span className="text-readout-dim">Code</span>
            <span className="font-bold tracking-[0.3em] text-marigold">{ code }</span>
        </p>
    );
}
