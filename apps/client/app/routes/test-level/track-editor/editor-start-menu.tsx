import type { CSSProperties } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { withStart } from '../start-point/start-point.utils';
import { closeStartMenu, pickStart } from './track-editor.state';
import { useEditorStore } from './use-editor-store';

export function EditorStartMenu() {
    const menu = useEditorStore( ( s ) => s.startMenu );
    const hasStart = useEditorStore( ( s ) => s.start !== null );
    const { search } = useLocation();
    const navigate = useNavigate();
    if ( menu === null ) return null;
    const choose = ( at: typeof menu.at | null ) => {
        void navigate( { search: withStart( search, pickStart( at ) ) }, { replace: true, preventScrollReset: true } );
    };
    return (
        <div
            role="menu"
            style={ { '--menu-x': `${ menu.px }px`, '--menu-y': `${ menu.py }px` } as CSSProperties }
            className="absolute top-[var(--menu-y)] left-[var(--menu-x)] z-10 flex min-w-40 flex-col border border-line-2 bg-deep py-1 text-[13px] uppercase tracking-[0.2em] text-hud shadow-lg"
            onContextMenu={ ( e ) => e.preventDefault() }
        >
            <button
                type="button"
                role="menuitem"
                onClick={ () => choose( menu.at ) }
                className="cursor-pointer px-3 py-2 text-left hover:bg-void hover:text-marigold"
            >
                Start here
            </button>
            { hasStart ? (
                <button
                    type="button"
                    role="menuitem"
                    onClick={ () => choose( null ) }
                    className="cursor-pointer px-3 py-2 text-left hover:bg-void hover:text-marigold"
                >
                    Clear start
                </button>
            ) : null }
            <button
                type="button"
                role="menuitem"
                onClick={ closeStartMenu }
                className="cursor-pointer px-3 py-2 text-left text-dim hover:bg-void hover:text-hud"
            >
                Cancel
            </button>
        </div>
    );
}
