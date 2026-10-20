import { DEFAULT_SIM_CONFIG, RULE_SPECS } from '@slur/shared';
import { describe, expect, test } from 'vitest';
import { tunedSimConfig } from '../routes/test-level/tuned-sim-config';
import { setNum } from './tuning';
import { isNumberPath, NUMBER_TUNABLES } from './tuning-schema';

const ruleIds = [ ...RULE_SPECS.keys() ];

describe( 'rule dials', () => {
    test( 'every rule spec has a dial with its range and sim default', () => {
        for ( const spec of RULE_SPECS.values() ) {
            if ( ! isNumberPath( spec.id ) ) throw new Error( `no dial for ${ spec.id }` );
            const dial = NUMBER_TUNABLES[ spec.id ];
            expect( dial ).toEqual( {
                value: DEFAULT_SIM_CONFIG[ spec.key ],
                min: spec.min,
                max: spec.max,
                step: spec.step,
                rebuild: false,
            } );
        }
    } );

    test( 'every lower-case namespaced dial is a rule', () => {
        const ruleShaped = Object.keys( NUMBER_TUNABLES ).filter( ( path ) => /^[a-z]/.test( path ) );
        expect( ruleShaped.sort() ).toEqual( [ ...ruleIds ].sort() );
    } );

    test( 'the test-level config reads a rule dial live', () => {
        const config = tunedSimConfig();
        setNum( 'tug.range', 120 );
        expect( config.tugRange ).toBe( 120 );
    } );

    test( 'the test-level config keeps rule getters when spread', () => {
        setNum( 'seeker.flyY', 3.3 );
        expect( { ...tunedSimConfig() }.seekerFlyY ).toBe( 3.3 );
    } );
} );
