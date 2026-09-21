const PROBE_ROUGHNESS = [ 0.2, 0.9 ] as const;

export function RoughnessProbes( { radius, envMapIntensity = 1 }: { radius: number; envMapIntensity?: number } ) {
    return (
        <group>
            { PROBE_ROUGHNESS.map( ( roughness, i ) => (
                <mesh key={ roughness } position={ [ ( i * 2 - 1 ) * radius * 1.6, radius, 0 ] }>
                    <sphereGeometry args={ [ radius, 48, 32 ] } />
                    <meshStandardMaterial
                        color="#8b9099"
                        roughness={ roughness }
                        metalness={ 0 }
                        envMapIntensity={ envMapIntensity }
                    />
                </mesh>
            ) ) }
        </group>
    );
}
