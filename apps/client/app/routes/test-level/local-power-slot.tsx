import { useQueryFirst, useTag } from 'koota/react';
import { Armed, LocalPlayer } from '../../game/ecs/traits';
import { PowerSlot } from '../../game/hud/power-slot';

export function LocalPowerSlot() {
    const ship = useQueryFirst( LocalPlayer );
    const armed = useTag( ship, Armed );
    return armed ? <PowerSlot label="Bolt" hint="E · Fire" /> : <PowerSlot label="—" hint="Grab a pickup" />;
}
