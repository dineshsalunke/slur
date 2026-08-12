import type { Room } from '@colyseus/sdk';
import { PHASE, type RunState, SET_CLASS_MESSAGE, SET_COLOR_MESSAGE, SHIP_ORDER, START_MESSAGE } from '@slur/shared';
import { Fragment } from 'react';
import { HudButton } from '../../ui/hud-button';
import { HudPanel } from '../../ui/hud-panel';
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
            <HudPanel className="fixed top-4 left-4 max-w-[320px] px-3.5 py-3">
                <h2 className="mb-2 text-[13px] font-bold uppercase tracking-[3px] text-cyan">Lobby</h2>
                <Roster players={ view.players } hostId={ view.hostId } selfId={ view.selfId } />
            </HudPanel>

            <HudPanel className="fixed bottom-4 left-1/2 flex -translate-x-1/2 flex-col gap-2 px-3.5 py-3">
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[11px] uppercase tracking-[2px] opacity-[0.75]">Colour</span>
                    { COLORS.map( ( hex, id ) => (
                        <button
                            key={ hex }
                            type="button"
                            disabled={ locked }
                            className={ `h-[22px] w-[22px] cursor-pointer rounded-full border-2 p-0 disabled:cursor-default disabled:opacity-50 ${ self?.colorId === id ? 'border-white shadow-[0_0_10px_#fff]' : 'border-transparent' }` }
                            style={ { background: hex } }
                            aria-label={ `colour ${ id + 1 }` }
                            onClick={ () => room.send( SET_COLOR_MESSAGE, id ) }
                        />
                    ) ) }
                </div>
                <div className="flex flex-wrap items-stretch gap-1.5">
                    <span className="text-[11px] uppercase tracking-[2px] opacity-[0.75]">Ship</span>
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
            </HudPanel>

            <HudPanel className="fixed right-4 bottom-4 flex flex-col items-stretch gap-2.5 px-3.5 py-3">
                { isHost ? (
                    <HudButton variant="go" disabled={ locked } onClick={ () => room.send( START_MESSAGE ) }>
                        GO ▶
                    </HudButton>
                ) : (
                    <span className="text-center text-[12px] tracking-[1px] opacity-70">Waiting for host…</span>
                ) }
                <LeaveButton />
            </HudPanel>
        </Fragment>
    );
}
