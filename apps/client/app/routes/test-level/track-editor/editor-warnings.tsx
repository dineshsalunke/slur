import { BLOCK_ID_STRIDE } from '@slur/shared';
import { crowdedSegments } from './track-editor.utils';
import { useEditorStore } from './use-editor-store';

export function EditorWarnings() {
    const blocks = useEditorStore( ( s ) => s.level.blocks );
    const crowded = crowdedSegments( blocks );
    if ( crowded.length === 0 ) return null;
    return (
        <p className="border border-threat px-3 py-2 text-[12px] text-threat">
            Over { BLOCK_ID_STRIDE } blocks in segment { crowded.join( ', ' ) }. Block ids will collide.
        </p>
    );
}
