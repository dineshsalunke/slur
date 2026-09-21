export function ColorDot( { hex }: { hex: string } ) {
    return <span className="h-3 w-3 shrink-0 rounded-full shadow-dot" style={ { background: hex } } />;
}
