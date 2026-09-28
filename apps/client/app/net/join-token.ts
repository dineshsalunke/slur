const JOIN_TOKEN_KEY = 'slur.joinToken.v1';
const TOKEN_BYTES = 16;

let fallback: string | null = null;

function freshToken(): string {
    const bytes = crypto.getRandomValues( new Uint8Array( TOKEN_BYTES ) );
    return Array.from( bytes, ( b ) => b.toString( 16 ).padStart( 2, '0' ) ).join( '' );
}

export function browserJoinToken(): string {
    try {
        const saved = localStorage.getItem( JOIN_TOKEN_KEY );
        if ( saved ) return saved;
        const token = freshToken();
        localStorage.setItem( JOIN_TOKEN_KEY, token );
        return token;
    } catch {
        fallback ??= freshToken();
        return fallback;
    }
}
