import { useChatLines } from '../../../net/chat-store';
import { playerBg } from '../../colors';

export function ChatLines() {
    const lines = useChatLines();

    return (
        <ol
            aria-label="Messages"
            aria-live="polite"
            className="m-0 flex max-h-32 min-h-16 list-none flex-col-reverse overflow-y-auto px-3 py-2 [scrollbar-width:thin] sm:max-h-44"
        >
            { lines.length === 0 && <li className="text-[13px] text-readout-dim">Say hi to the room.</li> }
            { lines.map( ( line ) => (
                <li key={ line.id } className="py-0.5 text-[14px] leading-snug break-words">
                    <span
                        aria-hidden="true"
                        className={ `mr-2 inline-block size-2 align-middle ${ playerBg( line.colorId ) }` }
                    />
                    <span className="font-semibold text-readout">{ line.name }</span>
                    <span className="text-readout-dim"> · </span>
                    <span className="text-readout">{ line.text }</span>
                </li>
            ) ) }
        </ol>
    );
}
