import { PowerCell } from '../power-cell/power-cell';
import { PowerGem } from '../power-gem/power-gem';
import { SLOTS } from './power-rack.constants';

export function PowerRack() {
    return (
        <div className="absolute right-0 bottom-0 flex items-end gap-[0.75em] text-[clamp(11px,2vh,20px)]">
            <PowerGem />
            <div className="flex flex-col items-end gap-[0.5em]">
                <div className="flex">
                    { SLOTS.map( ( slot ) => (
                        <PowerCell key={ slot } slot={ slot } />
                    ) ) }
                </div>
                <span className="text-[0.78em] font-normal tracking-[0.2em] text-readout-dim pointer-coarse:hidden">
                    E Fire · F Back · Q Cycle · X Drop
                </span>
            </div>
        </div>
    );
}
