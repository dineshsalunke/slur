import { HeldPower } from '@slur/shared';
import { useQueryFirst, useTrait } from 'koota/react';
import { Held, LocalPlayer } from '../ecs/traits';
import { useSelectedSlot } from '../input/power-select';

const LABEL: Record< number, string > = { [ HeldPower.bolt ]: 'Bolt', [ HeldPower.seeker ]: 'Seeker' };

export function PowerCell( { slot }: { slot: number } ) {
    const ship = useQueryFirst( LocalPlayer );
    const held = useTrait( ship, Held );
    const selected = useSelectedSlot() === slot;
    const label = LABEL[ held?.slots[ slot ] ?? HeldPower.none ];
    return (
        <div
            className={ `flex min-w-[6.5em] flex-col items-start gap-[0.4em] border-b-2 px-[0.5em] pb-[0.4em] leading-none ${
                selected ? 'border-marigold' : 'border-transparent'
            }` }
        >
            <span className="text-[0.78em] tracking-[0.2em] text-readout-dim">{ slot + 1 }</span>
            <span className={ `font-semibold tracking-[0.16em] ${ label ? '' : 'text-readout-dim' }` }>
                { label ?? '—' }
            </span>
        </div>
    );
}
