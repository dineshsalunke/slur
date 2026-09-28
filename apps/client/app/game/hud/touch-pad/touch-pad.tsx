import { TouchDpad } from './touch-dpad/touch-dpad';
import { TouchStick } from './touch-stick/touch-stick';

export function TouchPad() {
    return (
        <div className="pointer-events-none fixed inset-0 z-[24] hidden pointer-coarse:block">
            <TouchStick />
            <TouchDpad />
        </div>
    );
}
