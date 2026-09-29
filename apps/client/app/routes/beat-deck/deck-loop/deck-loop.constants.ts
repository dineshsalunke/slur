import { scheduleSystems } from '../../../game/frame/schedule';
import { GAMEPAD_SYSTEM } from '../../../game/input/gamepad';
import { DIAL_SYNC_SYSTEM } from '../../../game/scene/dial-sync/dial-sync.constants';
import {
    type DeckFrame,
    deckCamera,
    deckFlight,
    deckHover,
    deckRenderInterp,
    deckRestart,
    deckShipChoice,
    deckTakeStop,
} from './deck-loop.utils';

export const DECK_SCHEDULE = scheduleSystems< DeckFrame >( 'deck', [
    GAMEPAD_SYSTEM,
    DIAL_SYNC_SYSTEM,
    { id: 'deck.ship-choice', phase: 'simulate', run: deckShipChoice },
    { id: 'deck.restart', phase: 'simulate', after: [ 'deck.ship-choice' ], run: deckRestart },
    { id: 'deck.flight', phase: 'simulate', after: [ 'deck.restart' ], run: deckFlight },
    { id: 'deck.take-stop', phase: 'simulate', after: [ 'deck.flight' ], run: deckTakeStop },
    { id: 'deck.render-interp', phase: 'sync', run: deckRenderInterp },
    { id: 'deck.hover', phase: 'sync', after: [ 'deck.render-interp' ], run: deckHover },
    { id: 'deck.camera', phase: 'sync', after: [ 'deck.hover' ], run: deckCamera },
] );
