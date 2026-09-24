import { useSyncExternalStore } from 'react';
import { replayView, restartReplay, SPEEDS, setSpeed, togglePlay } from './replay-state';

const BTN = 'border border-line-2 px-3 py-1';

export function ReplayTransport() {
    const v = useSyncExternalStore( replayView.subscribe, replayView.get );
    return (
        <section className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
                <button type="button" className={ BTN } onClick={ togglePlay }>
                    { v.playing ? 'Pause' : 'Play' }
                </button>
                <button type="button" className={ BTN } onClick={ restartReplay }>
                    Restart
                </button>
            </div>
            <div className="flex flex-wrap items-center gap-1">
                <span className="w-16 text-dim">speed</span>
                { SPEEDS.map( ( s ) => (
                    <button
                        key={ s }
                        type="button"
                        className={ `border px-2 py-0.5 ${ s === v.speed ? 'border-marigold text-marigold' : 'border-line-2 text-dim' }` }
                        onClick={ () => setSpeed( s ) }
                    >
                        { s }×
                    </button>
                ) ) }
            </div>
            <p className="text-dim">Space play/pause · R restart · [ ] speed</p>
        </section>
    );
}
