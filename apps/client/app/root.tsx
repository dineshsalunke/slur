import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import type { Route } from './+types/root';
import './app.css';

// Base styling that used to live in app.css html/body rules is now Tailwind utilities on <html>/<body>: a
// committed dark theme (no light mode) and a full-screen canvas app that never scrolls (overflow-hidden).
// Preflight already resets margin + box-sizing, so only the theme/layout intent remains here.
export function Layout( { children }: { children: React.ReactNode } ) {
    return (
        <html lang="en" className="overflow-hidden [color-scheme:dark]">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <Meta />
                <Links />
            </head>
            <body className="min-h-screen overflow-hidden bg-void font-display text-fg antialiased">
                { children }
                <ScrollRestoration />
                <Scripts />
            </body>
        </html>
    );
}

export default function App() {
    return <Outlet />;
}

export function ErrorBoundary( { error }: Route.ErrorBoundaryProps ) {
    let message = 'Oops!';
    let details = 'An unexpected error occurred.';
    let stack: string | undefined;

    if ( isRouteErrorResponse( error ) ) {
        message = error.status === 404 ? '404' : 'Error';
        details = error.status === 404 ? 'The requested page could not be found.' : error.statusText || details;
    } else if ( import.meta.env.DEV && error && error instanceof Error ) {
        details = error.message;
        stack = error.stack;
    }

    return (
        <main>
            <h1>{ message }</h1>
            <p>{ details }</p>
            { stack && (
                <pre>
                    <code>{ stack }</code>
                </pre>
            ) }
        </main>
    );
}
