import { Client } from '@colyseus/sdk';

let client: Client | null = null;

export function getClient(): Client {
    if ( ! client ) {
        const serverPort = import.meta.env.VITE_SERVER_PORT || '2567';
        client = new Client( `ws://${ window.location.hostname }:${ serverPort }` );
    }
    return client;
}
