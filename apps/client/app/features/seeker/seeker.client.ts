import { seekerFeature } from '@slur/shared';
import { defineClientFeature } from '../../engine/define-client-feature';
import { SeekerField } from './seeker-field/seeker-field';
import { SEEKER_GLYPH } from './seeker-glyph';
import { SeekerPickups } from './seeker-pickups/seeker-pickups';
import { SeekerWarning } from './seeker-warning/seeker-warning';

export const seekerClient = defineClientFeature( {
    id: 'seeker',
    sim: seekerFeature,
    views: { scene: SeekerField, pickups: SeekerPickups },
    hud: { glyph: SEEKER_GLYPH, overlay: SeekerWarning },
} );
