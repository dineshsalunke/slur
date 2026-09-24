export function FullscreenGlyph( { on }: { on: boolean } ) {
    return (
        <svg viewBox="0 0 20 20" aria-hidden="true" className="h-[16px] w-4 flex-none">
            <path
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="square"
                d={
                    on
                        ? 'M7 2 V7 H2 M13 2 V7 H18 M7 18 V13 H2 M13 18 V13 H18'
                        : 'M2 7 V2 H7 M18 7 V2 H13 M2 13 V18 H7 M18 13 V18 H13'
                }
            />
        </svg>
    );
}
