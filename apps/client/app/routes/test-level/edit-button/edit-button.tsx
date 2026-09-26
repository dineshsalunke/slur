import { Link, useLocation, useMatch } from 'react-router';

export function EditButton() {
    const { search } = useLocation();
    const editing = useMatch( '/test-level/edit' );
    if ( editing ) return null;
    return (
        <Link
            to={ { pathname: '/test-level/edit', search } }
            className="fixed top-4 left-4 z-30 border border-line-2 bg-deep/80 px-4 py-2 text-[13px] uppercase tracking-[0.2em] text-hud hover:border-marigold"
        >
            Edit
        </Link>
    );
}
