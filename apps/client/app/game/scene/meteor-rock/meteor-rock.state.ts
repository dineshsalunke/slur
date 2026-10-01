import { num } from '../../../dev/tuning';
import { disposeRock, type MeteorRock, meteorRock } from './meteor-rock.utils';

let built: { token: number; rock: MeteorRock } | null = null;

export function rockFor( token: number ): MeteorRock {
    if ( built && built.token === token ) return built.rock;
    if ( built ) disposeRock( built.rock );
    built = {
        token,
        rock: meteorRock( {
            seed: num( 'Meteor.seed' ),
            cells: num( 'Meteor.cells' ),
            jagged: num( 'Meteor.jagged' ),
            elongation: num( 'Meteor.elongation' ),
            lumps: num( 'Meteor.lumps' ),
            ridges: num( 'Meteor.ridges' ),
            craters: num( 'Meteor.craters' ),
            craterSize: num( 'Meteor.craterSize' ),
            boulders: num( 'Meteor.boulders' ),
        } ),
    };
    return built.rock;
}
