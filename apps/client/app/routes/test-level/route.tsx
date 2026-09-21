import { TestLevelCanvas } from './test-level-canvas';

export function meta() {
    return [
        { title: 'SLUR — Test Level' },
        { name: 'description', content: 'Fixed flyable level for art work (no netcode)' },
    ];
}

export default function TestLevel() {
    return <TestLevelCanvas />;
}
