import { DEFAULT_SIM_CONFIG, type SimConfig } from '@slur/shared';
import { num } from '../../dev/tuning';

export function tunedSimConfig(): SimConfig {
    return {
        ...DEFAULT_SIM_CONFIG,
        get pickupGrabR() {
            return num( 'Pickup.grabR' );
        },
        get tugThrowMinS() {
            return num( 'Tug.throwMinS' );
        },
        get tugThrowMaxS() {
            return num( 'Tug.throwMaxS' );
        },
        get tugS() {
            return num( 'Tug.pullS' );
        },
        get towS() {
            return num( 'Tug.towS' );
        },
        get tugRange() {
            return num( 'Tug.range' );
        },
        get tugBlockMin() {
            return num( 'Tug.blockMin' );
        },
        get tugBlockMax() {
            return num( 'Tug.blockMax' );
        },
        get tugLatchSlack() {
            return num( 'Tug.latchSlack' );
        },
        get seekerFlyY() {
            return num( 'Seeker.flyY' );
        },
    };
}
