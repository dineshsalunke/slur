import { createBloom, createBoostBlur, updateBloom, updateBoostBlur } from './post-effects.utils';
import { POST_SLOTS } from './scene-effects.constants';
import type { PostEffect } from './scene-effects.utils';

export const POST_EFFECTS: readonly PostEffect[] = [
    { id: 'boost-blur', slot: 'beforeBloom', create: createBoostBlur, update: updateBoostBlur },
    { id: 'bloom', slot: 'bloom', create: createBloom, update: updateBloom },
];

export const POST_CHAIN: readonly PostEffect[] = [ ...POST_EFFECTS ].sort(
    ( a, b ) => POST_SLOTS.indexOf( a.slot ) - POST_SLOTS.indexOf( b.slot ),
);
