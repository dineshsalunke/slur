import { CHAT_HISTORY_LINES, type ChatLine, cleanChatText } from '@slur/shared';

export const CHAT_BURST = 5;
export const CHAT_WINDOW_MS = 5000;

export interface ChatSender {
    id: string;
    name: string;
    colorId: number;
}

export class ChatLog {
    private lines: ChatLine[] = [];
    private readonly sent = new Map< string, number[] >();
    private nextId = 1;

    post( sender: ChatSender, raw: unknown, nowMs: number ): ChatLine | null {
        const text = cleanChatText( raw );
        if ( ! text ) return null;
        const recent = ( this.sent.get( sender.id ) ?? [] ).filter( ( t ) => nowMs - t < CHAT_WINDOW_MS );
        this.sent.set( sender.id, recent );
        if ( recent.length >= CHAT_BURST ) return null;
        recent.push( nowMs );
        const line: ChatLine = { id: this.nextId++, from: sender.id, name: sender.name, colorId: sender.colorId, text };
        this.lines = [ ...this.lines, line ].slice( -CHAT_HISTORY_LINES );
        return line;
    }

    history(): readonly ChatLine[] {
        return this.lines;
    }

    forget( senderId: string ): void {
        this.sent.delete( senderId );
    }
}
