import { defineRules } from '../../rules/define-rules.js';

export const SEEKER_RULES = defineRules( 'seeker', {
    flyY: { key: 'seekerFlyY', min: 0.5, max: 7, step: 0.1 },
} );
