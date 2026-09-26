import { DEFAULT_SIM_CONFIG, type SimConfig } from '@slur/shared';
import { num } from '../../dev/tuning';

export function tunedSimConfig(): SimConfig {
    return {
        ...DEFAULT_SIM_CONFIG,
        get pickupGrabR() {
            return num( 'Pickup.grabR' );
        },
    };
}
