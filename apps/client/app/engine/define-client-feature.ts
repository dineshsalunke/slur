import type { SimFeature } from '@slur/shared';
import type { ComponentType } from 'react';
import type { FrameSystem } from '../game/frame/schedule';
import type { NetFrame } from '../game/net-loop/net-loop.utils';

export type ViewSlot = 'scene';

export type NetHandlers = Readonly< Record< string, ( payload: never ) => void > >;

export interface ClientFeature {
    readonly id: string;
    readonly sim?: SimFeature;
    readonly systems?: readonly FrameSystem< NetFrame >[];
    readonly views?: Readonly< Partial< Record< ViewSlot, ComponentType > > >;
    readonly net?: NetHandlers;
}

export function defineClientFeature< const F extends ClientFeature >( feature: F ): F {
    return feature;
}
