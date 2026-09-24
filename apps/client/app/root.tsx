import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import type { Route } from './+types/root';
import './app.css';

export function Layout( { children }: { children: React.ReactNode } ) {
    return (
        <html lang="en" className="overflow-hidden leading-[normal] [color-scheme:dark]">
            <head>
                <meta charSet="utf-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
                <meta name="theme-color" content="#05060a" />
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <link rel="manifest" href="/manifest.webmanifest" />
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
