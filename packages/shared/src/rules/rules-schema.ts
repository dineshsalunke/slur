import { MapSchema, Schema, type } from '@colyseus/schema';

export const SET_RULES_MESSAGE = 'setRules';

export class RulesState extends Schema {
    @type( { map: 'float32' } ) overrides = new MapSchema< number >();
}
