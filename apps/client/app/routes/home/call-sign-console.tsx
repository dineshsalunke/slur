import type { Room } from '@colyseus/sdk';
import type { RunState } from '@slur/shared';
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { RoomList } from '../../lobby/room-list';
import { hostRoom, joinRoom } from '../../net/matchmaking';
import { Button } from '../../ui/button';
import { Panel } from '../../ui/panel';

export const NAME_KEY = 'slur:name';

export function CallSignConsole( { savedName }: { savedName: string } ) {
    const navigate = useNavigate();
    const [ name, setName ] = useState( savedName );
    const [ busy, setBusy ] = useState( false );

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
