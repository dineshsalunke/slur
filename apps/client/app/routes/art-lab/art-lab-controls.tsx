import { SEG_LEN, SHIP_ORDER, type ShipId, shipOf, TRACK_SEGMENTS } from '@slur/shared';
import { Fragment, useState } from 'react';
import { ArtLabSkyControls } from './art-lab-sky-controls';
import { LAB_DEFAULT_SHIP } from './lab-defaults';
import { LAB_LAYER_KEYS, type LabLayerKey, type LabLayers } from './lab-layers';
import { labCommands, labControls } from './lab-state';

const JUMPS: ReadonlyArray< { label: string; frac: number } > = [
    { label: 'start', frac: 0 },
    { label: 'build', frac: 0.25 },
    { label: 'chorus', frac: 0.45 },
    { label: 'valley', frac: 0.75 },
    { label: 'final', frac: 0.9 },
];

const BTN = 'rounded border border-white/15 px-2 py-1 font-mono text-[11px] transition-colors hover:bg-white/10';
const BTN_ON = 'border-amber-400/60 bg-amber-400/15 text-amber-200';
const BTN_OFF = 'text-white/60';

export function ArtLabControls( {
    seed,
    onSeed,
    envIndex,
    onEnv,
    envNames,
    bloom,
    onBloom,
    layers,
    onLayer,
}: {
    seed: number;
    onSeed: ( seed: number ) => void;
    envIndex: number;
    onEnv: ( index: number ) => void;
    envNames: readonly string[];
    bloom: boolean;
    onBloom: ( on: boolean ) => void;
    layers: LabLayers;
    onLayer: ( key: LabLayerKey ) => void;
} ) {
    const [ shipId, setShipId ] = useState< ShipId >( LAB_DEFAULT_SHIP );
    const [ paused, setPaused ] = useState( labControls.paused );
    const [ ghost, setGhost ] = useState( labControls.ghost );

    return (
        <div className="pointer-events-auto fixed top-4 left-4 z-10 w-64 rounded-lg border border-white/10 bg-black/75 p-3 font-mono text-[11px] text-white/80 backdrop-blur">
            <div className="mb-2 text-[12px] font-semibold tracking-wide text-amber-300">SLUR · ART LAB</div>

            <div className="mb-2 flex gap-1">
                <button
                    type="button"
                    className={ `${ BTN } ${ paused ? BTN_ON : BTN_OFF }` }
                    onClick={ () => {
                        labControls.paused = ! paused;
                        setPaused( ! paused );
                    } }
                >
                    { paused ? 'paused' : 'running' }
                </button>
                <button
                    type="button"
                    className={ `${ BTN } ${ ghost ? BTN_ON : BTN_OFF }` }
                    onClick={ () => {
                        labControls.ghost = ! ghost;
                        setGhost( ! ghost );
                    } }
                >
                    { ghost ? 'ghost' : 'fly' }
                </button>
                <button
                    type="button"
                    className={ `${ BTN } ${ bloom ? BTN_ON : BTN_OFF }` }
                    onClick={ () => onBloom( ! bloom ) }
                >
                    bloom
                </button>
            </div>

            <div className="mb-1 text-white/40">layers</div>
            <div className="mb-2 flex flex-wrap gap-1">
                { LAB_LAYER_KEYS.map( ( key ) => (
                    <button
                        key={ key }
                        type="button"
                        className={ `${ BTN } ${ layers[ key ] ? BTN_ON : BTN_OFF }` }
                        onClick={ () => onLayer( key ) }
                    >
                        { key }
                    </button>
                ) ) }
            </div>

            <div className="mb-1 text-white/40">sky framing</div>
            <ArtLabSkyControls />

            <div className="mb-1 text-white/40">environment</div>
            <div className="mb-2 flex gap-1">
                { envNames.map( ( name, i ) => (
                    <button
                        key={ name }
                        type="button"
                        className={ `${ BTN } ${ i === envIndex ? BTN_ON : BTN_OFF }` }
                        onClick={ () => onEnv( i ) }
                    >
                        { String.fromCharCode( 65 + i ) }
                    </button>
                ) ) }
            </div>

            <div className="mb-1 text-white/40">ship</div>
            <div className="mb-2 flex flex-wrap gap-1">
                { SHIP_ORDER.map( ( id ) => (
                    <button
                        key={ id }
                        type="button"
                        className={ `${ BTN } ${ id === shipId ? BTN_ON : BTN_OFF }` }
                        onClick={ () => {
                            labCommands.setShip = id;
                            setShipId( id );
                        } }
                    >
                        { shipOf( id ).name }
                    </button>
                ) ) }
            </div>

            <div className="mb-1 text-white/40">jump to</div>
            <div className="mb-2 flex flex-wrap gap-1">
                { JUMPS.map( ( j ) => (
                    <button
                        key={ j.label }
                        type="button"
                        className={ `${ BTN } ${ BTN_OFF }` }
                        onClick={ () => {
                            labCommands.jumpToZ = j.frac * TRACK_SEGMENTS * SEG_LEN;
                        } }
                    >
                        { j.label }
                    </button>
                ) ) }
            </div>

            <div className="mb-1 text-white/40">seed</div>
            <div className="mb-2 flex gap-1">
                <input
                    type="number"
                    value={ seed }
                    onChange={ ( e ) => onSeed( Number( e.target.value ) || 0 ) }
                    className="w-full rounded border border-white/15 bg-black/50 px-2 py-1 font-mono text-[11px] text-white/80"
                />
                <button type="button" className={ `${ BTN } ${ BTN_OFF }` } onClick={ () => onSeed( seed + 1 ) }>
                    +1
                </button>
            </div>

            <div className="text-[10px] leading-relaxed text-white/35">
                <Fragment>W/S throttle · A/D strafe · Space jump</Fragment>
            </div>
        </div>
    );
}
