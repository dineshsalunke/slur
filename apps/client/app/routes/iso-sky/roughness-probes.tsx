/** The two ends of the roughness range. A near-mirror and a near-matte, nothing in between to hide behind. */
const PROBE_ROUGHNESS = [ 0.2, 0.9 ] as const;

/**
 * The falsifiable self-test: a rock-like matte dielectric at `roughness 0.2` beside one at `roughness 0.9`.
 * If the two look identical, the environment is lighting nothing and task 1 is not done.
 *
 * These are deliberately NOT on the track. The sky's lighting job is only the far rock field and the planet's
 * terminator — the track lights itself from its own emissives — so a probe sitting trackside would invite the
 * conclusion "the sky is too dim to light anything", which board 12 says is correct rather than a bug.
 *
 * `metalness: 0` because stone is a dielectric, and metalness with no environment map renders black.
 * `envMapIntensity` is set explicitly because it is PER-MATERIAL — `scene.environmentIntensity` does not
 * reach a material that never sampled the environment in the first place.
 *
 * Until slice 3 lands the bake these render black with the lab's neutral rig off. That IS the baseline: the
 * test is only worth anything if it can fail, and right now it does.
 */
export function RoughnessProbes( { radius, envMapIntensity = 1 }: { radius: number; envMapIntensity?: number } ) {
    return (
        <group>
            { /* Low and to the sides: this lab's subject is the SKY, so the probes must not sit in the middle
                 of the frame the nebula is being judged in. */ }
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
