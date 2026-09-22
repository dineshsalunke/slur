import { PowerGem } from './power-gem';

export function PowerSlot( { label, hint }: { label: string; hint: string } ) {
    return (
        <div className="absolute right-0 bottom-0 flex items-center gap-[0.75em] text-[clamp(11px,2vh,20px)]">
            <PowerGem />
            <div className="flex flex-col items-start gap-[0.4em] leading-none">
                <span className="font-semibold tracking-[0.16em]">{ label }</span>
                <span className="text-[0.78em] font-normal tracking-[0.2em] text-readout-dim">{ hint }</span>
            </div>
        </div>
    );
}
