import { TRACK_GENS } from '@slur/shared';
import { Form, useSearchParams } from 'react-router';
import { genOf, randomSeed, seedOf } from '../test-level-canvas/test-level-canvas.utils';

export function EditorNewTrack() {
    const [ params ] = useSearchParams();
    const gen = genOf( params.get( 'gen' ) );
    const seed = seedOf( params.get( 'seed' ) );
    return (
        <Form method="get" action="/test-level/edit" className="flex flex-col gap-2">
            <h2 className="text-[11px] uppercase tracking-[0.2em] text-dim">New track</h2>
            <div className="grid grid-cols-[auto_1fr_auto] gap-1">
                <select
                    key={ gen }
                    name="gen"
                    defaultValue={ gen }
                    aria-label="Generator"
                    className="border border-line-2 bg-void px-2 py-2 font-mono text-[13px] text-hud focus:border-marigold focus:outline-none"
                >
                    { TRACK_GENS.map( ( g ) => (
                        <option key={ g } value={ g }>
                            { g }
                        </option>
                    ) ) }
                </select>
                <input
                    key={ seed }
                    name="seed"
                    type="number"
                    min={ 1 }
                    step={ 1 }
                    required
                    defaultValue={ seed }
                    aria-label="Seed"
                    className="min-w-0 border border-line-2 bg-void px-2 py-2 font-mono text-[13px] text-hud focus:border-marigold focus:outline-none"
                />
                <button
                    type="button"
                    aria-label="Random seed"
                    onClick={ ( e ) => {
                        const input = e.currentTarget.form?.elements.namedItem( 'seed' );
                        if ( input instanceof HTMLInputElement ) input.value = String( randomSeed() );
                    } }
                    className="cursor-pointer border border-line-2 px-2 py-2 text-[15px] text-hud hover:border-marigold"
                >
                    ⚄
                </button>
            </div>
            <button
                type="submit"
                className="cursor-pointer border border-line-2 px-3 py-2 text-[13px] uppercase tracking-[0.2em] text-hud hover:border-marigold"
            >
                Create
            </button>
        </Form>
    );
}
