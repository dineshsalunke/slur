import { type ReactNode, useState } from 'react';
import { IsoLabCanvas } from './iso-lab-canvas';
import { IsoLabControls } from './iso-lab-controls';
import { type OverlayMode, ReferenceOverlay } from './reference-overlay';

export interface IsoLabProps {
    title: string;
    size: number;
    board: string;
    children: ReactNode;
    rig?: boolean;
}

export function IsoLab( { title, size, board, children, rig = true }: IsoLabProps ) {
    const [ mode, setMode ] = useState< OverlayMode >( 'off' );
    const [ boardId, setBoardId ] = useState( board );
    const [ t, setT ] = useState( 0.5 );
    const [ bloom, setBloom ] = useState( true );
    const [ rigOn, setRigOn ] = useState( rig );
    const [ grid, setGrid ] = useState( rig );

    const renderPane = mode === 'split' ? { right: `${ ( 1 - t ) * 100 }%` } : { right: 0 };

    return (
        <main className="fixed inset-0 overflow-hidden bg-black">
            <div className="absolute inset-y-0 left-0" style={ renderPane }>
                <IsoLabCanvas size={ size } bloom={ bloom } grid={ grid } rig={ rigOn }>
                    { children }
                </IsoLabCanvas>
            </div>

            <ReferenceOverlay key={ boardId } mode={ mode } boardId={ boardId } t={ t } />

            <IsoLabControls
                title={ title }
                size={ size }
                mode={ mode }
                onMode={ setMode }
                boardId={ boardId }
                onBoard={ setBoardId }
                t={ t }
                onT={ setT }
                bloom={ bloom }
                onBloom={ setBloom }
                grid={ grid }
                onGrid={ setGrid }
                rig={ rigOn }
                onRig={ setRigOn }
            />
        </main>
    );
}
