import { CHAT_MAX_CHARS, CHAT_SEND_MESSAGE } from '@slur/shared';
import { useRef } from 'react';
import type { RunRoomLike } from '../../../net/run-room-like';

export function ChatInput( { room }: { room: RunRoomLike } ) {
    const field = useRef< HTMLInputElement >( null );

    return (
        <form
            className="flex border-t border-readout/15"
            onSubmit={ ( e ) => {
                e.preventDefault();
                const input = field.current;
                if ( ! input ) return;
                const text = input.value.trim();
                if ( text ) room.send( CHAT_SEND_MESSAGE, text );
                input.value = '';
            } }
        >
            <input
                ref={ field }
                type="text"
                aria-label="Chat message"
                placeholder="Say something…"
                autoComplete="off"
                enterKeyHint="send"
                maxLength={ CHAT_MAX_CHARS }
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-[14px] text-readout placeholder:text-readout-dim focus:outline-none"
                onKeyDown={ ( e ) => {
                    e.stopPropagation();
                    if ( e.key === 'Escape' ) e.currentTarget.blur();
                } }
            />
            <button
                type="submit"
                className="cursor-pointer px-4 text-[12px] font-bold uppercase tracking-[0.2em] text-marigold hover:bg-readout/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-core"
            >
                Send
            </button>
        </form>
    );
}
