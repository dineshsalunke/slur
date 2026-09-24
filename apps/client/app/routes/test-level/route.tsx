import { loadSfx } from '../../audio/sfx-map';
import { TestLevelCanvas } from './test-level-canvas';

export function meta() {
    return [
        { title: 'SLUR — Test Level' },
        { name: 'description', content: 'Fixed flyable level for art work (no netcode)' },
    ];
}

export function clientLoader() {
    void loadSfx( 'pickup' );
    return null;
}

export default function TestLevel() {
    return <TestLevelCanvas />;
}
