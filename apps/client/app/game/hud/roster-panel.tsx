import { RosterLine } from './roster-line';

export interface RosterEntry {
    id: string;
    rank: number;
    name: string;
    self?: boolean;
}

export function RosterPanel( { connected, entries }: { connected: number; entries: readonly RosterEntry[] } ) {
    return (
        <ol className="absolute top-0 left-0 m-0 flex max-w-[16em] list-none flex-col gap-[0.62em] p-0 text-[clamp(11px,1.75vh,17px)] leading-none font-semibold tracking-[0.16em]">
            <li className="flex items-baseline gap-[0.9em]">
                <span className="w-[1.4em] shrink-0 text-right tabular-nums">{ connected }</span>
                <span>Connected</span>
            </li>
            { entries.map( ( e ) => (
                <RosterLine key={ e.id } rank={ e.rank } name={ e.name } self={ e.self } />
            ) ) }
        </ol>
    );
}
