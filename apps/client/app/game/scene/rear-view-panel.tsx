import { useThree } from '@react-three/fiber';
import type { RearViewSurface } from './rear-view-surface';

const TOP_MARGIN = 18;

interface RearViewPanelProps {
    surface: RearViewSurface;
    width: number;
    height: number;
}

export function RearViewPanel( { surface, width, height }: RearViewPanelProps ) {
    const screenHeight = useThree( ( state ) => state.size.height );
    const y = screenHeight / 2 - TOP_MARGIN - height / 2;

    return (
        <mesh position={ [ 0, y, 0 ] }>
            <planeGeometry args={ [ width, height ] } />
            <shaderMaterial args={ [ surface ] } />
        </mesh>
    );
}
