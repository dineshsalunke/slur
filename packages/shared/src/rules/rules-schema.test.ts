import assert from 'node:assert/strict';
import { test } from 'node:test';
import { RunState } from '../schema.js';
import { RulesState } from './rules-schema.js';

interface FieldMeta {
    readonly name: string;
    readonly index: number;
}

function wireNames( schema: object ): string[] {
    const meta = ( schema as Record< symbol, Record< number, FieldMeta | undefined > | undefined > )[ Symbol.metadata ];
    const names: string[] = [];
    for ( let i = 0; meta?.[ i ] !== undefined; i++ ) names.push( meta[ i ]?.name ?? '' );
    return names;
}

test( 'RunState keeps its wire order and appends rules last', () => {
    assert.deepEqual( wireNames( RunState ), [
        'phase',
        'elapsed',
        'descriptor',
        'players',
        'hostId',
        'countdown',
        'finishDeadline',
        'projectiles',
        'pickupTaken',
        'blockBroken',
        'seekers',
        'mines',
        'portals',
        'raceCap',
        'rules',
    ] );
} );

test( 'RulesState holds only the overrides map', () => {
    assert.deepEqual( wireNames( RulesState ), [ 'overrides' ] );
} );
