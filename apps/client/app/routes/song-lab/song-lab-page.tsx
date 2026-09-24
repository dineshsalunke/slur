import type { Track } from '@slur/shared';
import { LabPicker } from './lab-picker';
import type { LabView } from './lab-view';
import { ReplayReadout } from './replay-readout';
import { ReplayTransport } from './replay-transport';
import { RunResults } from './run-results';
import { SongLabCanvas } from './song-lab-canvas';
import { VariantInfo } from './variant-info';

export function SongLabPage( { view, track }: { view: LabView; track: Track } ) {
    return (
        <main className="flex h-dvh bg-void font-mono text-fg text-sm">
            <div className="relative min-w-0 flex-1">
                <SongLabCanvas track={ track } shipId={ view.shipId } />
                <ReplayReadout />
            </div>
            <aside className="flex w-96 shrink-0 flex-col gap-4 overflow-y-auto border-line-2 border-l p-4">
                <h1 className="text-lg text-marigold">Song Lab</h1>
                <LabPicker view={ view } />
                <ReplayTransport />
                <RunResults view={ view } />
                <VariantInfo view={ view } />
            </aside>
        </main>
    );
}
