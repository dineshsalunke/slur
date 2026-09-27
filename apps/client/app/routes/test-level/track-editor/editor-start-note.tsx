import { useEditorStore } from './use-editor-store';

export function EditorStartNote() {
    const note = useEditorStore( ( s ) => s.startNote );
    if ( note === null ) return null;
    return <p className="text-[12px] leading-relaxed text-threat">{ note }</p>;
}
