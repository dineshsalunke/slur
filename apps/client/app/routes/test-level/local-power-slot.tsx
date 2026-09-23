import { HeldPower } from '@slur/shared';
import { useQueryFirst, useTrait } from 'koota/react';
import { Held, LocalPlayer } from '../../game/ecs/traits';
import { PowerSlot } from '../../game/hud/power-slot';

const LABEL: Record< number, string > = { [ HeldPower.bolt ]: 'Bolt', [ HeldPower.seeker ]: 'Seeker' };

export function LocalPowerSlot() {
    const ship = useQueryFirst( LocalPlayer );
    const held = useTrait( ship, Held );
    const label = held ? LABEL[ held.power ] : undefined;
    return label ? <PowerSlot label={ label } hint="E · Fire" /> : <PowerSlot label="—" hint="Grab a pickup" />;
}
