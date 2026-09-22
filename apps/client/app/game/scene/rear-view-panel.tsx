import { useThree } from '@react-three/fiber';
import type { Material } from 'three';

const TOP_MARGIN = 18;

interface RearViewPanelProps {
    surface: Material;
    width: number;
    height: number;
}

export function RearViewPanel( { surface, width, height }: RearViewPanelProps ) {
    const screenHeight = useThree( ( state ) => state.size.height );
    const y = screenHeight / 2 - TOP_MARGIN - height / 2;

    return (
        <mesh position={ [ 0, y, 0 ] }>
            <planeGeometry args={ [ width, height ] } />
            <primitive object={ surface } attach="material" />
        </mesh>
    );
}
