import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomList } from '../../lobby/room-list';
import { hostRoom, joinRoom } from '../../net/matchmaking';
import { Button } from '../../ui/button';
import { Panel } from '../../ui/panel';

// Where the display name is persisted. Lives here, next to the write; `home.tsx`'s clientLoader imports it
// for the read.
export const NAME_KEY = 'slur:name';

// The landing "console" — the call-sign field, the Host CTA, and the live room list. THIS is the leaf that
// owns `name` and `busy`; the Home route module owns neither (non-negotiable #10, r3f.md "Componentize by
// subscription boundary"). It matters here because Home also renders the sibling <LandingScene/> R3F Canvas:
// while `name` lived on Home, every keystroke re-rendered Home and reconciled the ENTIRE Canvas subtree —
// ambientLight, Grid, Environment, Bloom, rig — for a value the scene never reads. Measured at 2 LandingScene
// renders per keystroke before this split, 0 after.
//
// `busy` is a different case and is here for a different reason. It flips at most twice per visit, on a
// click, immediately before navigating away, so it was never a per-frame cost — but it is still reactive
// state that must not sit on the Canvas's parent. This component is also the LOWEST correct home for it:
// the Host button and RoomList are siblings that both read it, so pushing it any further down would mean
// duplicating it or introducing a store.
export function CallSignConsole( { savedName }: { savedName: string } ) {
    const navigate = useNavigate();
    const [ name, setName ] = useState( savedName );
    const [ busy, setBusy ] = useState( false );

    // Host/Join share this: persist the name, run the matchmaking action (create or joinById), then navigate
    // into the game. On failure, stay on the landing (re-enable the buttons) rather than dead-end.
    const enter = async ( action: ( name: string ) => Promise< Room< RunState > > ) => {
        const clean = name.trim() || 'Racer';
        localStorage.setItem( NAME_KEY, clean );
        setBusy( true );
        try {
            const room = await action( clean );
            navigate( `/game/${ room.roomId }` );
        } catch {
            setBusy( false );
        }
    };

    return (
        <Panel className="w-[min(560px,92vw)]">
            <div className="flex items-stretch gap-2.5">
                <div className="flex flex-1 flex-col gap-1.5">
                    <label htmlFor="callsign" className="font-mono text-[10px] uppercase tracking-[0.24em] text-dim">
                        Call sign
                    </label>
                    <input
                        id="callsign"
                        className="rounded-[2px] border border-line-2 bg-black/35 px-3.5 py-3 font-mono text-[15px] text-fg outline-none transition-[border-color,box-shadow] duration-[180ms] focus:border-cyan focus:shadow-focus"
                        type="text"
                        value={ name }
                        maxLength={ 16 }
                        placeholder="Racer"
                        onChange={ ( e ) => setName( e.target.value ) }
                    />
                </div>
                <div className="flex flex-none flex-col justify-end">
                    <Button variant="primary" disabled={ busy } onClick={ () => enter( ( n ) => hostRoom( n ) ) }>
                        Host a run ▸
                    </Button>
                </div>
            </div>

            <RoomList busy={ busy } onJoin={ ( roomId ) => enter( ( n ) => joinRoom( roomId, n ) ) } />
        </Panel>
    );
}
