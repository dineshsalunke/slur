import { HeldPower } from '@slur/shared';
import { useQueryFirst, useTrait } from 'koota/react';
import { Held, LocalPlayer } from '../../ecs/traits';
import { useSelectedSlot } from '../../input/power-select';
import { GemGlyph } from './gem-glyph';

export function PowerGem() {
    const ship = useQueryFirst( LocalPlayer );
    const held = useTrait( ship, Held );
    const slot = useSelectedSlot();
    const power = held?.slots[ slot ] ?? HeldPower.none;
    return (
        <svg
            viewBox="0 0 48 48"
            aria-hidden="true"
            focusable="false"
            className={ `h-[clamp(26px,4.6vh,46px)] w-[clamp(26px,4.6vh,46px)] shrink-0 drop-shadow-power-gem ${
                power === HeldPower.none ? 'opacity-40' : ''
            }` }
        >
            <GemGlyph power={ power } />
        </svg>
    );
}
