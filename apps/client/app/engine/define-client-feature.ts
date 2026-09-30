import type { SimFeature } from '@slur/shared';
import type { ComponentType } from 'react';
import type { FrameSystem } from '../game/frame/schedule';
import type { NetFrame } from '../game/net-loop/net-loop.utils';
import type { GlyphShape } from '../game/scene/power-arc/glyph-shapes';

export type ViewSlot = 'scene' | 'pickups';

export interface NetContext {
    readonly sessionId: string;
}

export type NetHandlers = Readonly< Record< string, ( payload: never, net: NetContext ) => void > >;

export interface HudSlots {
    readonly glyph?: readonly GlyphShape[];
}

export interface ClientFeature {
    readonly id: string;
    readonly sim?: SimFeature;
    readonly systems?: readonly FrameSystem< NetFrame >[];
    readonly views?: Readonly< Partial< Record< ViewSlot, ComponentType > > >;
    readonly hud?: HudSlots;
    readonly net?: NetHandlers;
}

export function defineClientFeature< const F extends ClientFeature >( feature: F ): F {
    return feature;
}
