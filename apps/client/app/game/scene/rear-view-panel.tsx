import { useThree } from '@react-three/fiber';
import type { Texture } from 'three';
import { ACCENT_ANCHOR } from './accent';
import { REAR_PANEL_HEIGHT, REAR_PANEL_WIDTH } from './rear-view-frame';

const TOP_MARGIN = 18;
const FRAME_PAD = 3;
const RULE_HEIGHT = 2;
const FRAME_COLOR = '#15171a';

export function RearViewPanel( { map }: { map: Texture } ) {
    const height = useThree( ( state ) => state.size.height );
    const y = height / 2 - TOP_MARGIN - REAR_PANEL_HEIGHT / 2;

    return (
        <group position={ [ 0, y, 0 ] }>
            <mesh position={ [ 0, 0, -1 ] }>
                <planeGeometry args={ [ REAR_PANEL_WIDTH + FRAME_PAD * 2, REAR_PANEL_HEIGHT + FRAME_PAD * 2 ] } />
                <meshBasicMaterial color={ FRAME_COLOR } toneMapped={ false } />
            </mesh>
            <mesh>
                <planeGeometry args={ [ REAR_PANEL_WIDTH, REAR_PANEL_HEIGHT ] } />
                <meshBasicMaterial map={ map } toneMapped={ false } />
            </mesh>
            <mesh position={ [ 0, -( REAR_PANEL_HEIGHT / 2 + FRAME_PAD + RULE_HEIGHT / 2 ), 0 ] }>
                <planeGeometry args={ [ REAR_PANEL_WIDTH + FRAME_PAD * 2, RULE_HEIGHT ] } />
                <meshBasicMaterial color={ ACCENT_ANCHOR } toneMapped={ false } />
            </mesh>
        </group>
    );
}
