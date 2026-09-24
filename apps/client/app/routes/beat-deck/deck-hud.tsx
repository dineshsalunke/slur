import { DeckStatus } from './deck-status';
import { ShipPicker } from './ship-picker';
import { SongPicker } from './song-picker';

export function DeckHud() {
    return (
        <div className="pointer-events-none fixed top-4 left-4 z-20 flex max-w-md flex-col gap-2 font-mono text-hud text-xs">
            <div className="pointer-events-auto flex flex-col gap-2 border border-line-2 bg-void/80 p-3 shadow-hud">
                <SongPicker />
                <ShipPicker />
            </div>
            <DeckStatus />
        </div>
    );
}
