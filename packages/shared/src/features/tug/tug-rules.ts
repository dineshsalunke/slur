import { defineRules } from '../../rules/define-rules.js';

export const TUG_RULES = defineRules( 'tug', {
    throwMinS: { key: 'tugThrowMinS', min: 0, max: 1.5, step: 0.01 },
    throwMaxS: { key: 'tugThrowMaxS', min: 0, max: 1.5, step: 0.01 },
    pullS: { key: 'tugS', min: 0.2, max: 5, step: 0.05 },
    towS: { key: 'towS', min: 0.2, max: 5, step: 0.05 },
    range: { key: 'tugRange', min: 20, max: 400, step: 5 },
    blockMin: { key: 'tugBlockMin', min: 0, max: 800, step: 5 },
    blockMax: { key: 'tugBlockMax', min: 20, max: 1000, step: 5 },
    latchSlack: { key: 'tugLatchSlack', min: 1, max: 3, step: 0.05 },
} );
