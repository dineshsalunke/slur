export function Chevron( { dir, className = '' }: { dir: 'left' | 'right'; className?: string } ) {
    return (
        <svg
            viewBox="0 0 10 16"
            aria-hidden="true"
            className={ `h-3.5 w-2.5 flex-none ${ dir === 'left' ? '-scale-x-100' : '' } ${ className }` }
        >
            <path d="M2 2 L8 8 L2 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" />
        </svg>
    );
}
