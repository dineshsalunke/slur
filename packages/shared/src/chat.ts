export const CHAT_SEND_MESSAGE = 'chat';
export const CHAT_LINE_MESSAGE = 'chatLine';
export const CHAT_HISTORY_MESSAGE = 'chatHistory';
export const CHAT_MAX_CHARS = 140;
export const CHAT_HISTORY_LINES = 30;

export interface ChatLine {
    id: number;
    from: string;
    name: string;
    colorId: number;
    text: string;
}

export function cleanChatText( raw: unknown ): string {
    if ( typeof raw !== 'string' ) return '';
    const flat = raw
        .slice( 0, CHAT_MAX_CHARS * 4 )
        .replace( /[\p{Cc}\s]+/gu, ' ' )
        .trim();
    return [ ...flat ].slice( 0, CHAT_MAX_CHARS ).join( '' ).trim();
}
