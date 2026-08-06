import { GameCanvas } from '../../game/game-canvas';

export function meta() {
    return [ { title: 'SLUR — Solo' }, { name: 'description', content: 'Solo flight test' } ];
}

export default function Solo() {
    return <GameCanvas />;
}
