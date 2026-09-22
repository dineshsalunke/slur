const KEY = 'slur.tuning.v1';

type Value = number | string;

interface Stored {
    value: Value;
    from: Value;
}

function load(): Record< string, Stored > {
    try {
        const raw = globalThis.localStorage?.getItem( KEY );
        return raw ? ( JSON.parse( raw ) as Record< string, Stored > ) : {};
    } catch {
        return {};
    }
}

let stored = load();

export function restore< T extends Value >( path: string, fallback: T ): T {
    const entry = stored[ path ];
    if ( ! entry || entry.from !== fallback ) return fallback;
    return entry.value as T;
}

export function remember( path: string, value: Value, fallback: Value ): void {
    stored[ path ] = { value, from: fallback };
    try {
        globalThis.localStorage?.setItem( KEY, JSON.stringify( stored ) );
    } catch {}
}

export function forget(): void {
    stored = {};
    try {
        globalThis.localStorage?.removeItem( KEY );
    } catch {}
}
