import { EnvLabCanvas } from './env-lab-canvas';

export function meta() {
    return [ { title: 'SLUR — Env Lab' }, { name: 'description', content: 'Atmosphere variant lab (keys 1/2/3)' } ];
}

export default function EnvLab() {
    return <EnvLabCanvas />;
}
