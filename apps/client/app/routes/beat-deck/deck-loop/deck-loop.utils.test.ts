import { createWorld } from 'koota';
import { describe, expect, it } from 'vitest';
import { mirrorLocalStatus } from '../../../game/ecs/status-tags';
import { Dead, LocalPlayer, Prev, Sim, Stunned } from '../../../game/ecs/traits';
import { restartDeckRun } from './deck-loop.utils';

describe( 'restartDeckRun', () => {
    it( 'clears the Dead and Stunned tags at once', () => {
        const world = createWorld();
        const ship = world.spawn( LocalPlayer, Sim, Prev );
        ship.set( Sim, ( prev ) => ( { ...prev, dead: true, stunTimer: 0.5 } ) );
        mirrorLocalStatus( world );
        expect( ship.has( Dead ) ).toBe( true );
        expect( ship.has( Stunned ) ).toBe( true );

        restartDeckRun( world );

        expect( ship.get( Sim )?.dead ).toBe( false );
        expect( ship.has( Dead ) ).toBe( false );
        expect( ship.has( Stunned ) ).toBe( false );
        world.destroy();
    } );
} );
