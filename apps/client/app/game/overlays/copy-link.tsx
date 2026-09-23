import { useState } from 'react';
import { useLocation } from 'react-router';

export function CopyLink() {
    const { pathname } = useLocation();
    const [ copied, setCopied ] = useState( false );

    const onCopy = async () => {
        try {
            await navigator.clipboard.writeText( location.href );
            setCopied( true );
        } catch {
            setCopied( false );
        }
    };

    return (
        <button
            type="button"
            onClick={ onCopy }
            onBlur={ () => setCopied( false ) }
            className="flex h-8 max-w-full cursor-pointer items-center gap-3 border border-readout/20 bg-deep/85 px-3 text-[12px] uppercase tracking-[0.16em] transition-colors duration-150 hover:border-readout/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-readout"
        >
            <span aria-live="polite" className="font-semibold text-readout">
                { copied ? 'Copied' : 'Copy link' }
            </span>
            <span className="truncate font-normal normal-case tracking-[0.04em] text-readout-dim">{ pathname }</span>
        </button>
    );
}
