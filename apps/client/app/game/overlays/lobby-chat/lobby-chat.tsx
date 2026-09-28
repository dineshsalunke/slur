import type { RunRoomLike } from '../../../net/run-room-like';
import { ChatInput } from './chat-input';
import { ChatLines } from './chat-lines';

export function LobbyChat( { room, className = '' }: { room: RunRoomLike; className?: string } ) {
    return (
        <section
            aria-label="Lobby chat"
            className={ `${ className } flex flex-col border border-readout/15 bg-deep/85 focus-within:border-readout/45` }
        >
            <ChatLines />
            <ChatInput room={ room } />
        </section>
    );
}
