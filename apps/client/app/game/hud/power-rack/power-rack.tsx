import { powerHint } from './power-rack.utils';

export function PowerRack() {
    return (
        <span className="absolute right-0 bottom-0 text-[clamp(8.5px,1.56vh,15.6px)] font-normal tracking-[0.2em] text-readout-dim pointer-coarse:hidden">
            { powerHint() }
        </span>
    );
}
