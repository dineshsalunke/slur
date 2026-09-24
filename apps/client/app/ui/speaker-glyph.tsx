export function SpeakerGlyph( { muted }: { muted: boolean } ) {
    return (
        <svg viewBox="0 0 22 20" aria-hidden="true" className="h-[18px] w-5 flex-none">
            <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                <path d="M3 7.5 H6.5 L10.5 3.5 V16.5 L6.5 12.5 H3 Z" />
                <path
                    d={ muted ? 'M14 7 L19 13 M19 7 L14 13' : 'M13.5 7.5 L15 10 L13.5 12.5 M16.5 5 L19 10 L16.5 15' }
                />
            </g>
        </svg>
    );
}
