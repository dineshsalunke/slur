import { Form, Link, useActionData, useLocation, useNavigation } from 'react-router';
import { useEditorStore } from './use-editor-store';

export function EditorActions() {
    const name = useEditorStore( ( s ) => s.level.name );
    const dirty = useEditorStore( ( s ) => s.dirty );
    const saving = useNavigation().state === 'submitting';
    const result = useActionData< { error?: string } | undefined >();
    const { search } = useLocation();
    return (
        <Form method="post" className="flex flex-col gap-2">
            <label className="flex flex-col gap-1 text-[11px] uppercase tracking-[0.2em] text-dim">
                Name
                <input
                    key={ name }
                    name="name"
                    defaultValue={ name }
                    required
                    className="border border-line-2 bg-void px-3 py-2 font-mono text-[13px] normal-case tracking-normal text-hud focus:border-marigold focus:outline-none"
                />
            </label>
            <button
                type="submit"
                disabled={ saving }
                className="cursor-pointer bg-marigold px-3 py-2 text-[13px] font-bold uppercase tracking-[0.2em] text-deep hover:bg-core disabled:cursor-wait disabled:opacity-70"
            >
                { saving ? 'Saving…' : 'Save + Play' }
            </button>
            <Link
                to={ { pathname: '/test-level', search } }
                className="border border-line-2 px-3 py-2 text-center text-[13px] uppercase tracking-[0.2em] text-hud hover:border-marigold"
            >
                { dirty ? 'Discard' : 'Close' }
            </Link>
            { result?.error ? <p className="text-[12px] text-threat">{ result.error }</p> : null }
        </Form>
    );
}
