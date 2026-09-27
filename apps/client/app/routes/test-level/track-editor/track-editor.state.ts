import {
    type AuthoredLevel,
    forgetAuthoredLevel,
    isLevelSlug,
    registerAuthoredLevel,
    serializeAuthoredLevel,
} from '@slur/shared';
import type { MouseEvent, PointerEvent } from 'react';
import { typingTarget } from '../../../dev/typing-target';
import { type EditorHistory, emptyHistory, historyKeyOf, pushHistory, stepHistory } from './editor-history.utils';
import { normalizeLevel } from './editor-shapes.utils';
import { type SavedTrack, savedTracks } from './editor-tracks';
import { EDITOR_TOOLS, WHEEL_ZOOM_RATE } from './track-editor.constants';
import {
    applyTool,
    clampCamera,
    drawMap,
    hash8,
    slugOf,
    snapRect,
    snapStart,
    trackLength,
    viewOf,
    worldAt,
    zoomAround,
} from './track-editor.utils';

export type EditorTool = 'destructible' | 'solid' | 'gap' | 'eraser';

export type EditorSnap = 1 | 2 | 4 | 8;

export interface EditorPoint {
    x: number;
    z: number;
}

export interface EditorCamera {
    zoom: number;
    scrollX: number;
    scrollZ: number;
}

export interface EditorStartMenu {
    px: number;
    py: number;
    at: EditorPoint;
}

export interface EditorState {
    level: AuthoredLevel;
    history: EditorHistory< AuthoredLevel >;
    tool: EditorTool;
    snap: EditorSnap;
    camera: EditorCamera;
    viewport: { width: number; height: number };
    anchor: EditorPoint | null;
    hover: EditorPoint | null;
    dirty: boolean;
    start: EditorPoint | null;
    startMenu: EditorStartMenu | null;
    startNote: string | null;
    saved: SavedTrack[];
    confirmDelete: string | null;
}

const state: EditorState = {
    level: {
        version: 1,
        id: 'untitled',
        name: 'untitled',
        length: 420,
        source: null,
        savedAt: '',
        blocks: [],
        gaps: [],
    },
    history: emptyHistory(),
    tool: 'destructible',
    snap: 4,
    camera: { zoom: 1, scrollX: 0, scrollZ: 0 },
    viewport: { width: 1, height: 1 },
    anchor: null,
    hover: null,
    dirty: false,
    start: null,
    startMenu: null,
    startNote: null,
    saved: [],
    confirmDelete: null,
};

let clean: AuthoredLevel = state.level;

const listeners = new Set< () => void >();

export function subscribeEditor( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

export function editorState(): Readonly< EditorState > {
    return state;
}

function changed(): void {
    for ( const listener of listeners ) listener();
}

export function openEditor( level: AuthoredLevel, start: EditorPoint | null, saved: SavedTrack[] ): void {
    state.level = normalizeLevel( level );
    state.history = emptyHistory();
    clean = state.level;
    state.saved = saved;
    state.confirmDelete = null;
    state.camera = { zoom: 1, scrollX: 0, scrollZ: 0 };
    state.anchor = null;
    state.hover = null;
    state.dirty = false;
    state.start = start;
    state.startMenu = null;
    state.startNote = null;
    changed();
}

export function openStartMenu( e: MouseEvent< HTMLCanvasElement > ): void {
    e.preventDefault();
    const r = e.currentTarget.getBoundingClientRect();
    state.anchor = null;
    state.startMenu = { px: e.clientX - r.left, py: e.clientY - r.top, at: pointOf( e ) };
    changed();
}

export function closeStartMenu(): void {
    if ( state.startMenu === null ) return;
    state.startMenu = null;
    changed();
}

export function pickStart( at: EditorPoint | null ): EditorPoint | null {
    const snapped = at === null ? null : snapStart( state.level, at );
    state.start = snapped?.point ?? null;
    state.startMenu = null;
    state.startNote =
        snapped?.moved === true
            ? `Start moved to x ${ snapped.point.x.toFixed( 1 ) }, z ${ snapped.point.z.toFixed( 1 ) }: the point you picked has no room for a ship.`
            : null;
    changed();
    return state.start;
}

export function setTool( tool: EditorTool ): void {
    state.tool = tool;
    changed();
}

export function setSnap( snap: EditorSnap ): void {
    state.snap = snap;
    changed();
}

function viewFor( canvas: HTMLCanvasElement ) {
    return viewOf( canvas.clientWidth, canvas.clientHeight, state.camera );
}

function setCamera( camera: EditorCamera ): void {
    state.camera = clampCamera( state.viewport.width, state.viewport.height, state.level, camera );
    changed();
}

export function zoomBy( factor: number ): void {
    const { width, height } = state.viewport;
    setCamera(
        zoomAround( width, height, state.level, state.camera, width / 2, height / 2, state.camera.zoom * factor ),
    );
}

export function fitWidth(): void {
    setCamera( { ...state.camera, zoom: 1, scrollX: 0 } );
}

function pointOf( e: MouseEvent< HTMLCanvasElement > ): EditorPoint {
    const r = e.currentTarget.getBoundingClientRect();
    return worldAt( viewFor( e.currentTarget ), e.clientX - r.left, e.clientY - r.top );
}

export function pressMap( e: PointerEvent< HTMLCanvasElement > ): void {
    if ( e.button !== 0 ) return;
    state.startMenu = null;
    e.currentTarget.setPointerCapture( e.pointerId );
    state.anchor = pointOf( e );
    state.hover = state.anchor;
    changed();
}

export function moveMap( e: PointerEvent< HTMLCanvasElement > ): void {
    state.hover = pointOf( e );
    changed();
}

export function releaseMap( e: PointerEvent< HTMLCanvasElement > ): void {
    if ( state.anchor === null ) return;
    const r = snapRect( state.anchor, pointOf( e ), state.snap, trackLength( state.level ) );
    state.anchor = null;
    if ( r !== null ) setShapes( pushHistory( state.history, state.level, applyTool( state.level, state.tool, r ) ) );
    changed();
}

function setShapes( step: { present: AuthoredLevel; history: EditorHistory< AuthoredLevel > } | null ): void {
    if ( step === null ) return;
    state.level = { ...state.level, blocks: step.present.blocks, gaps: step.present.gaps };
    state.history = step.history;
    state.dirty = state.level.blocks !== clean.blocks || state.level.gaps !== clean.gaps;
    changed();
}

export function travel( key: 'undo' | 'redo' ): void {
    setShapes( stepHistory( state.history, state.level, key ) );
}

export function cancelMap(): void {
    state.anchor = null;
    state.hover = null;
    changed();
}

export function leaveMap(): void {
    if ( state.anchor !== null ) return;
    state.hover = null;
    changed();
}

function wheelMap( canvas: HTMLCanvasElement, e: WheelEvent ): void {
    e.preventDefault();
    const v = viewFor( canvas );
    if ( e.ctrlKey || e.metaKey ) {
        const r = canvas.getBoundingClientRect();
        const zoom = state.camera.zoom * Math.exp( -e.deltaY * WHEEL_ZOOM_RATE );
        setCamera(
            zoomAround( v.width, v.height, state.level, state.camera, e.clientX - r.left, e.clientY - r.top, zoom ),
        );
        return;
    }
    setCamera( {
        ...state.camera,
        scrollX: state.camera.scrollX + e.deltaX / v.scale,
        scrollZ: state.camera.scrollZ - e.deltaY / v.scale,
    } );
}

function editorKeys( e: KeyboardEvent ): void {
    if ( typingTarget( e.target ) ) return;
    const key = historyKeyOf( e );
    if ( key !== null ) {
        e.preventDefault();
        travel( key );
    }
    if ( e.repeat || e.metaKey || e.ctrlKey || e.altKey ) return;
    const tool = EDITOR_TOOLS.find( ( t ) => t.key === e.key );
    if ( tool !== undefined ) setTool( tool.id );
    if ( e.key === 'Escape' ) {
        cancelMap();
        closeStartMenu();
    }
}

export function attachMap( canvas: HTMLCanvasElement | null ): ( () => void ) | undefined {
    const ctx = canvas?.getContext( '2d' );
    if ( ! canvas || ! ctx ) return undefined;
    const redraw = () => {
        const dpr = devicePixelRatio;
        const w = canvas.clientWidth;
        const h = canvas.clientHeight;
        if ( canvas.width !== Math.round( w * dpr ) || canvas.height !== Math.round( h * dpr ) ) {
            canvas.width = Math.round( w * dpr );
            canvas.height = Math.round( h * dpr );
        }
        ctx.setTransform( dpr, 0, 0, dpr, 0, 0 );
        state.viewport = { width: w, height: h };
        state.camera = clampCamera( w, h, state.level, state.camera );
        drawMap( ctx, viewOf( w, h, state.camera ), state );
    };
    const wheel = ( e: WheelEvent ) => wheelMap( canvas, e );
    const resize = new ResizeObserver( redraw );
    resize.observe( canvas );
    const unsubscribe = subscribeEditor( redraw );
    addEventListener( 'keydown', editorKeys );
    canvas.addEventListener( 'wheel', wheel, { passive: false } );
    return () => {
        resize.disconnect();
        unsubscribe();
        removeEventListener( 'keydown', editorKeys );
        canvas.removeEventListener( 'wheel', wheel );
    };
}

export function askDelete( id: string | null ): void {
    state.confirmDelete = id;
    changed();
}

export async function deleteSavedTrack( id: string ): Promise< { deleted: string } | { error: string } > {
    if ( ! isLevelSlug( id ) ) return { error: 'No such track.' };
    const res = await fetch( `/__tracks/${ id }`, { method: 'DELETE' } ).catch( () => null );
    if ( res === null || ! res.ok ) return { error: `Delete failed (${ res?.status ?? 'no server' }).` };
    forgetAuthoredLevel( id );
    return { deleted: id };
}

export async function reloadSaved(): Promise< void > {
    state.saved = await savedTracks();
    state.confirmDelete = null;
    changed();
}

export async function saveEditorLevel( name: string ): Promise< { url: string } | { error: string } > {
    const id = slugOf( name );
    if ( ! isLevelSlug( id ) ) return { error: 'Name needs a letter or a digit.' };
    const level = { ...state.level, id, name: name.trim(), savedAt: new Date().toISOString() };
    const body = serializeAuthoredLevel( level );
    const res = await fetch( `/__tracks/${ id }`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body,
    } ).catch( () => null );
    if ( res === null || ! res.ok ) return { error: `Save failed (${ res?.status ?? 'no server' }).` };
    registerAuthoredLevel( level );
    state.level = level;
    clean = level;
    state.dirty = false;
    changed();
    return { url: `/test-level?level=${ id }&v=${ hash8( body ) }` };
}
