import type * as THREE from 'three';

type Compile = THREE.Material[ 'onBeforeCompile' ];

interface Chain {
    installed: Compile;
    tags: Set< string >;
}

const chains = new WeakMap< THREE.Material, Chain >();

export function chainShaderPatch( material: THREE.Material, tag: string, patch: Compile ): boolean {
    const prior = material.onBeforeCompile;
    const chain = chains.get( material );
    const tags = chain && chain.installed === prior ? chain.tags : new Set< string >();
    if ( tags.has( tag ) ) return false;
    material.onBeforeCompile = ( shader, renderer ) => {
        prior.call( material, shader, renderer );
        patch.call( material, shader, renderer );
    };
    tags.add( tag );
    chains.set( material, { installed: material.onBeforeCompile, tags } );
    return true;
}
