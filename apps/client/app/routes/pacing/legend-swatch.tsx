export function LegendSwatch( { swatchClass, label }: { swatchClass: string; label: string } ) {
    return (
        <span className="flex items-center gap-1.5">
            <span className={ `inline-block h-2 w-3 shrink-0 rounded-sm ${ swatchClass }` } />
            { label }
        </span>
    );
}
