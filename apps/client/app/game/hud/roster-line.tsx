export function RosterLine( {
    rank,
    name,
    self = false,
    idle = false,
}: {
    rank: number;
    name: string;
    self?: boolean;
    idle?: boolean;
} ) {
    return (
        <li
            className={ `flex items-baseline gap-[0.9em] ${ self ? 'text-marigold text-shadow-readout-marigold' : '' } ${ idle ? 'opacity-55' : '' }` }
        >
            <span className="w-[1.4em] shrink-0 text-right tabular-nums">{ rank }</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{ name }</span>
            { idle && <span className="shrink-0 text-[0.8em] text-readout-dim">Idle</span> }
        </li>
    );
}
