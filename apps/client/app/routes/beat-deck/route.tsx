import { BeatDeckCanvas } from './beat-deck-canvas';

export function meta() {
    return [
        { title: 'SLUR — Beat Deck' },
        { name: 'description', content: 'Dev-only: fly an empty deck to a song and record the inputs' },
    ];
}

export default function BeatDeck() {
    return <BeatDeckCanvas />;
}
