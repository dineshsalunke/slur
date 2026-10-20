import { defineRules } from './define-rules.js';

export const CORE_RULES = defineRules( 'pickup', {
    grabR: { key: 'pickupGrabR', min: 0, max: 10, step: 0.1 },
} );
