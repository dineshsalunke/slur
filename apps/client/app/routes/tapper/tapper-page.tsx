import type { SongAnalysis } from '../../../tapper/beat-analysis';
import { KeyHelp } from './key-help';
import { LiveNotes } from './live-notes';
import { LoopForm } from './loop-form';
import { PlayheadReadout } from './playhead-readout';
import { RecBadge } from './rec-badge';
import { SectionForm } from './section-form';
import { TakeList } from './take-list';
import { TakeStrip } from './take-strip';
import { TransportBar } from './transport-bar';

export function TapperPage( { songs, missing }: { songs: SongAnalysis[]; missing: string[] } ) {
    return (
        <main className="min-h-dvh bg-void p-6 font-mono text-fg text-sm">
            <h1 className="mb-4 text-lg text-marigold">Tapper</h1>
            { missing.length > 0 && (
                <p className="mb-3 text-threat">
                    No analysis for { missing.join( ', ' ) }. Run: pnpm --filter @slur/client beat-analysis
                    .songs/&lt;file&gt;
                </p>
            ) }
            <SectionForm songs={ songs } />
            <div className="my-4 flex flex-wrap items-center gap-4">
                <TransportBar />
                <RecBadge />
                <PlayheadReadout />
            </div>
            <LoopForm />
            <TakeStrip />
            <LiveNotes />
            <TakeList />
            <KeyHelp />
        </main>
    );
}
