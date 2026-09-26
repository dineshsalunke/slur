import { Form, Link } from 'react-router';
import { LINK } from './seed-form.constants';

export function SeedForm( { seed }: { seed: number } ) {
    return (
        <Form method="get" className="flex items-center gap-1.5">
            <label htmlFor="pacing-seed" className="text-[11px] text-dim">
                seed
            </label>
            <Link to={ `?seed=${ seed - 1 }` } className={ LINK }>
                ‹
            </Link>
            <input
                key={ seed }
                id="pacing-seed"
                name="seed"
                defaultValue={ seed }
                inputMode="numeric"
                className="w-28 rounded border border-line-2 bg-deep px-2 py-0.5 font-mono text-xs text-hud"
            />
            <Link to={ `?seed=${ seed + 1 }` } className={ LINK }>
                ›
            </Link>
            <button type="submit" className={ LINK }>
                load
            </button>
        </Form>
    );
}
