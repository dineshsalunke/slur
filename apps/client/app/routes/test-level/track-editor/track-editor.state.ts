import {
    type AuthoredLevel,
    authoredLevel,
    clamp,
    DEFAULT_TRACK_GEN,
    decompileTrack,
    isLevelSlug,
    isTrackGen,
    parseAuthoredLevel,
    registerAuthoredLevel,
    resolveTrack,
    serializeAuthoredLevel,
} from '@slur/shared';
import type { PointerEvent, WheelEvent } from 'react';
import { typingTarget } from '../../../dev/typing-target';
import { TEST_LEVEL_SEED } from '../test-level-canvas/test-level-canvas.constants';
import { testLevelDescriptor } from '../test-level-canvas/test-level-canvas.utils';
import { EDITOR_TOOLS } from './track-editor.constants';
import {
    applyTool,
    drawMap,
    hash8,
    maxScrollZ,
    slugOf,
    snapRect,
    trackLength,
    viewOf,
    worldAt,
} from './track-editor.utils';

export type EditorTool = 'destructible' | 'solid' | 'gap' | 'eraser';

export type EditorSnap = 1 | 2 | 4 | 8;

export interface EditorPoint {
    x: number;
    z: number;
}

export interface EditorState {
    level: AuthoredLevel;
    tool: EditorTool;
    snap: EditorSnap;
    scrollZ: number;
    anchor: EditorPoint | null;
    hover: EditorPoint | null;
    dirty: boolean;
}

export interface SavedTrack {
    id: string;
    name: string;
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
    tool: 'destructible',
    snap: 4,
    scrollZ: 0,
    anchor: null,
    hover: null,
    dirty: false,
};

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

export function openEditor( level: AuthoredLevel ): void {
    state.level = level;
    state.scrollZ = 0;
    state.anchor = null;
    state.hover = null;
    state.dirty = false;
    changed();
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
    return viewOf( canvas.clientWidth, canvas.clientHeight, state.scrollZ );
}

function pointOf( e: PointerEvent< HTMLCanvasElement > ): EditorPoint {
    const r = e.currentTarget.getBoundingClientRect();
    return worldAt( viewFor( e.currentTarget ), e.clientX - r.left, e.clientY - r.top );
}

export function pressMap( e: PointerEvent< HTMLCanvasElement > ): void {
    if ( e.button !== 0 ) return;
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
    if ( r !== null ) {
        state.level = applyTool( state.level, state.tool, r );
        state.dirty = true;
    }
    changed();
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

export function wheelMap( e: WheelEvent< HTMLCanvasElement > ): void {
    const v = viewFor( e.currentTarget );
    state.scrollZ = clamp( state.scrollZ - e.deltaY / v.scale, 0, maxScrollZ( state.level, v ) );
    changed();
}

function editorKeys( e: KeyboardEvent ): void {
    if ( e.repeat || e.metaKey || e.ctrlKey || e.altKey || typingTarget( e.target ) ) return;
    const tool = EDITOR_TOOLS.find( ( t ) => t.key === e.key );
    if ( tool !== undefined ) setTool( tool.id );
    if ( e.key === 'Escape' ) cancelMap();
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
        drawMap( ctx, viewOf( w, h, state.scrollZ ), state );
    };
    const resize = new ResizeObserver( redraw );
    resize.observe( canvas );
    const unsubscribe = subscribeEditor( redraw );
    addEventListener( 'keydown', editorKeys );
    return () => {
        resize.disconnect();
        unsubscribe();
        removeEventListener( 'keydown', editorKeys );
    };
}

async function fetchLevel( id: string ): Promise< AuthoredLevel | undefined > {
    const res = await fetch( `/__tracks/${ id }` );
    return res.ok ? parseAuthoredLevel( await res.json() ) : undefined;
}

export async function editorSource( params: URLSearchParams ): Promise< AuthoredLevel > {
    const id = params.get( 'level' );
    if ( isLevelSlug( id ) ) {
        const level = authoredLevel( id ) ?? ( await fetchLevel( id ) );
        if ( level !== undefined ) return level;
    }
    const param = params.get( 'gen' );
    const gen = isTrackGen( param ) ? param : DEFAULT_TRACK_GEN;
    const name = `${ gen }-${ TEST_LEVEL_SEED }`;
    return decompileTrack( resolveTrack( testLevelDescriptor( gen ) ), {
        id: name,
        name,
        source: { gen, seed: TEST_LEVEL_SEED },
    } );
}

function savedTrack( v: unknown ): SavedTrack | null {
    if ( typeof v === 'string' ) return { id: v, name: v };
    if ( typeof v !== 'object' || v === null ) return null;
    const { id, name } = v as { id?: unknown; name?: unknown };
    return typeof id === 'string' ? { id, name: typeof name === 'string' ? name : id } : null;
}

export async function savedTracks(): Promise< SavedTrack[] > {
    const res = await fetch( '/__tracks' ).catch( () => null );
    if ( res === null || ! res.ok ) return [];
    const body: unknown = await res.json().catch( () => null );
    const rows = Array.isArray( body ) ? body : ( ( body as { tracks?: unknown } | null )?.tracks ?? [] );
    return Array.isArray( rows ) ? rows.map( savedTrack ).filter( ( t ) => t !== null ) : [];
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
    state.dirty = false;
    changed();
    return { url: `/test-level?level=${ id }&v=${ hash8( body ) }` };
}
