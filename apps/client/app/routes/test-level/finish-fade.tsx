import { registerFinishFade } from './finish-reset';

export function FinishFade() {
    return <div ref={ registerFinishFade } className="pointer-events-none fixed inset-0 z-30 bg-black opacity-0" />;
}
