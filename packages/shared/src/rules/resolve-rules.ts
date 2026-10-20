import { SIM_FEATURES } from '../features/registry.js';
import { DEFAULT_SIM_CONFIG, type SimConfig } from '../sim-config.js';
import { CORE_RULES } from './core-rules.js';
import type { RuleEntry } from './define-rules.js';

export type RuleOverrides = ReadonlyMap< string, number >;

export function indexRules( entries: readonly RuleEntry[] ): ReadonlyMap< string, RuleEntry > {
    const byId = new Map< string, RuleEntry >();
    const keys = new Set< string >();
    for ( const entry of entries ) {
        if ( byId.has( entry.id ) ) throw new Error( `rules: duplicate id "${ entry.id }"` );
        if ( keys.has( entry.key ) ) throw new Error( `rules: duplicate key "${ entry.key }"` );
        byId.set( entry.id, entry );
        keys.add( entry.key );
    }
    return byId;
}

export const RULE_SPECS = indexRules( [ ...CORE_RULES, ...SIM_FEATURES.flatMap( ( f ) => f.rules ?? [] ) ] );

export function resolveRules( overrides: Iterable< readonly [ string, number ] > ): SimConfig {
    const config = { ...DEFAULT_SIM_CONFIG };
    for ( const [ id, value ] of overrides ) {
        const spec = RULE_SPECS.get( id );
        if ( spec ) config[ spec.key ] = value;
    }
    return config;
}

function isPlainObject( value: unknown ): value is Readonly< Record< string, unknown > > {
    if ( typeof value !== 'object' || value === null ) return false;
    const proto = Object.getPrototypeOf( value );
    return proto === Object.prototype || proto === null;
}

function clampRule( spec: RuleEntry, value: number ): number {
    return Math.fround( Math.min( spec.max, Math.max( spec.min, value ) ) );
}

export function parseRuleOverrides( payload: unknown ): RuleOverrides | null {
    if ( ! isPlainObject( payload ) ) return null;
    const overrides = new Map< string, number >();
    for ( const [ id, value ] of Object.entries( payload ) ) {
        const spec = RULE_SPECS.get( id );
        if ( ! spec || typeof value !== 'number' || ! Number.isFinite( value ) ) return null;
        overrides.set( id, clampRule( spec, value ) );
    }
    return overrides;
}
