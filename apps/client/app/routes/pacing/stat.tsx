export function Stat( { label, value }: { label: string; value: string } ) {
    return (
        <div className="flex flex-col">
            <span className="text-[10px] text-dim uppercase tracking-wider">{ label }</span>
            <span className="font-mono text-sm text-hud">{ value }</span>
        </div>
    );
}
