export function RosterLine( { rank, name, self = false }: { rank: number; name: string; self?: boolean } ) {
    return (
        <li
            className={ `flex items-baseline gap-[0.9em] ${ self ? 'text-marigold text-shadow-readout-marigold' : '' }` }
        >
            <span className="w-[1.4em] shrink-0 text-right tabular-nums">{ rank }</span>
            <span className="overflow-hidden text-ellipsis whitespace-nowrap">{ name }</span>
        </li>
    );
}
