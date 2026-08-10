import type { Room } from '@colyseus/sdk';
import { PHASE, type RunState, SET_CLASS_MESSAGE, SET_COLOR_MESSAGE, SHIP_ORDER, START_MESSAGE } from '@slur/shared';
import { Fragment } from 'react';
import { COLORS } from '../colors';
import type { RunView } from '../net/use-run-view';
import { LeaveButton } from './leave-button';
import { Roster } from './roster';
import { ShipCard } from './ship-card';

// Lobby controls laid around the EDGES so the centred, orbiting local ship (the real scene, via
// updateLobbyCamera — there is NO 2nd preview Canvas) shows through: roster top-left, pickers bottom-centre,
// host GO + Leave bottom-right. Picking a ship/colour sends a message; the SERVER owns the change and patches
// it back → the ECS bridge swaps the ship's model/tint live (WYSIWYG). Pick controls are belt-and-suspenders
// disabled off-lobby (the server already gates them).
export function LobbyOverlay( { room, view }: { room: Room< RunState >; view: RunView } ) {
    const self = view.players.find( ( p ) => p.id === view.selfId );
    const isHost = view.selfId === view.hostId;
    const locked = view.phase !== PHASE.lobby;
    return (
        <Fragment>
            <div className="slur-panel slur-tl">
                <h2 className="slur-h">Lobby</h2>
                <Roster players={ view.players } hostId={ view.hostId } selfId={ view.selfId } />
            </div>

            <div className="slur-panel slur-bottom">
                <div className="slur-pickrow">
                    <span className="slur-label">Colour</span>
                    { COLORS.map( ( hex, id ) => (
                        <button
                            key={ hex }
                            type="button"
                            disabled={ locked }
                            className={ self?.colorId === id ? 'slur-swatch slur-on' : 'slur-swatch' }
                            style={ { background: hex } }
                            aria-label={ `colour ${ id + 1 }` }
                            onClick={ () => room.send( SET_COLOR_MESSAGE, id ) }
                        />
                    ) ) }
                </div>
                <div className="slur-pickrow slur-shiprow">
                    <span className="slur-label">Ship</span>
                    { SHIP_ORDER.map( ( shipId ) => (
                        <ShipCard
                            key={ shipId }
                            shipId={ shipId }
                            selected={ self?.shipId === shipId }
                            disabled={ locked }
                            onPick={ () => room.send( SET_CLASS_MESSAGE, shipId ) }
                        />
                    ) ) }
                </div>
            </div>

            <div className="slur-panel slur-br">
                { isHost ? (
                    <button
                        type="button"
                        className="slur-btn slur-go"
                        disabled={ locked }
                        onClick={ () => room.send( START_MESSAGE ) }
                    >
                        GO ▶
                    </button>
                ) : (
                    <span className="slur-wait">Waiting for host…</span>
                ) }
                <LeaveButton />
            </div>
        </Fragment>
    );
}
