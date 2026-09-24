import { type FormEvent, useState } from 'react';
import type { SongAnalysis } from '../../../tapper/beat-analysis';
import { loadSection } from './tapper-clock';

const RATES = [ 1, 0.875, 0.75, 0.625, 0.5 ];

export function SectionForm( { songs }: { songs: SongAnalysis[] } ) {
    const [ index, setIndex ] = useState( 0 );
    const song = songs[ index ];
    if ( ! song ) return <p className="text-dim">No analysed songs in apps/client/.songs/.</p>;

    const submit = ( e: FormEvent< HTMLFormElement > ) => {
        e.preventDefault();
        const submitter = ( e.nativeEvent as SubmitEvent ).submitter;
        const fd = new FormData( e.currentTarget, submitter );
        const picked = String( fd.get( 'section' ) ?? '' )
            .split( '-' )
            .map( Number );
        const [ from, to ] = picked.length === 2 ? picked : [ Number( fd.get( 'from' ) ), Number( fd.get( 'to' ) ) ];
        void loadSection( song, from, to, Number( fd.get( 'rate' ) ) );
        if ( submitter instanceof HTMLElement ) submitter.blur();
    };

    return (
        <form onSubmit={ submit } className="flex flex-col gap-2 border border-line p-3">
            <div className="flex flex-wrap items-center gap-3">
                <select
                    value={ index }
                    onChange={ ( e ) => setIndex( Number( e.target.value ) ) }
                    className="bg-deep px-2 py-1"
                >
                    { songs.map( ( s, i ) => (
                        <option key={ s.song } value={ i }>
                            { s.song } · { s.bpm } BPM · { s.bars.length } bars
                        </option>
                    ) ) }
                </select>
                <label className="flex items-center gap-1">
                    rate
                    <select name="rate" defaultValue="1" className="bg-deep px-2 py-1">
                        { RATES.map( ( r ) => (
                            <option key={ r } value={ r }>
                                { r }×
                            </option>
                        ) ) }
                    </select>
                </label>
                <label className="flex items-center gap-1">
                    bars
                    <input name="from" type="number" defaultValue={ 28 } className="w-16 bg-deep px-2 py-1" />
                    –
                    <input name="to" type="number" defaultValue={ 44 } className="w-16 bg-deep px-2 py-1" />
                </label>
                <button type="submit" className="border border-marigold px-3 py-1 text-marigold">
                    Load
                </button>
            </div>
            <div className="flex flex-wrap gap-1">
                { song.sections.map( ( s ) => (
                    <button
                        key={ s.fromBar }
                        type="submit"
                        name="section"
                        value={ `${ s.fromBar }-${ s.toBar }` }
                        className="border border-line-2 px-2 py-0.5 text-xs"
                    >
                        { s.fromBar }–{ s.toBar } { s.label }
                    </button>
                ) ) }
            </div>
        </form>
    );
}
