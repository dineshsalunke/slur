import type { SimConfig } from '../sim-config.js';

export type NumericConfigKey = {
    [ K in keyof SimConfig ]: SimConfig[ K ] extends number ? K : never;
}[ keyof SimConfig ];

export interface RuleSpec {
    readonly key: NumericConfigKey;
    readonly min: number;
    readonly max: number;
    readonly step: number;
}

export interface RuleEntry extends RuleSpec {
    readonly id: string;
}

export function defineRules( namespace: string, specs: Readonly< Record< string, RuleSpec > > ): readonly RuleEntry[] {
    return Object.entries( specs ).map( ( [ rule, spec ] ) => ( { id: `${ namespace }.${ rule }`, ...spec } ) );
}
