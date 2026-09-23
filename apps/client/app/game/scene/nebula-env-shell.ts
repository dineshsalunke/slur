import * as THREE from 'three';
import { col, num } from '../../dev/tuning';

const SHELL_RADIUS = 4;
const GROUND_DROP = 1.6;
const BAND_RADIUS = 3.9;
const BAND_HEIGHT_PER_UNIT = 0.04;

const ENV_NUMBERS = [
    'Env.skyIntensity',
    'Env.fillIntensity',
    'Env.groundIntensity',
    'Env.bandIntensity',
    'Env.bandHeight',
] as const;
const ENV_COLORS = [ 'Env.fillColor', 'Env.groundColor', 'Env.bandColor' ] as const;

export class NebulaEnvShell {
    private readonly groundMaterial = new THREE.MeshBasicMaterial( { side: THREE.DoubleSide } );
    private readonly bandMaterial = new THREE.MeshBasicMaterial( { side: THREE.BackSide } );
    private readonly ground = new THREE.Mesh( new THREE.CircleGeometry( SHELL_RADIUS, 32 ), this.groundMaterial );
    private readonly band = new THREE.Mesh(
        new THREE.CylinderGeometry( BAND_RADIUS, BAND_RADIUS, 1, 32, 1, true ),
        this.bandMaterial,
    );
    private readonly numbers = new Float64Array( ENV_NUMBERS.length ).fill( Number.NaN );
    private readonly colors: string[] = ENV_COLORS.map( () => '' );

    constructor(
        scene: THREE.Scene,
        sky: THREE.Mesh,
        private readonly gain: { value: number },
        private readonly fill: { value: THREE.Color },
    ) {
        sky.scale.setScalar( SHELL_RADIUS );
        this.ground.position.y = -GROUND_DROP;
        this.ground.rotation.x = -Math.PI / 2;
        scene.add( sky, this.ground, this.band );
    }

    read(): boolean {
        let changed = false;
        for ( let i = 0; i < ENV_NUMBERS.length; i++ ) {
            const v = num( ENV_NUMBERS[ i ] );
            if ( this.numbers[ i ] !== v ) {
                this.numbers[ i ] = v;
                changed = true;
            }
        }
        for ( let i = 0; i < ENV_COLORS.length; i++ ) {
            const v = col( ENV_COLORS[ i ] );
            if ( this.colors[ i ] !== v ) {
                this.colors[ i ] = v;
                changed = true;
            }
        }
        return changed;
    }

    apply(): void {
        this.gain.value = num( 'Env.skyIntensity' );
        this.fill.value.set( col( 'Env.fillColor' ) ).multiplyScalar( num( 'Env.fillIntensity' ) );
        this.groundMaterial.color.set( col( 'Env.groundColor' ) ).multiplyScalar( num( 'Env.groundIntensity' ) );
        this.bandMaterial.color.set( col( 'Env.bandColor' ) ).multiplyScalar( num( 'Env.bandIntensity' ) );
        this.band.scale.setY( num( 'Env.bandHeight' ) * BAND_HEIGHT_PER_UNIT );
    }

    dispose(): void {
        this.groundMaterial.dispose();
        this.bandMaterial.dispose();
        this.ground.geometry.dispose();
        this.band.geometry.dispose();
        this.numbers.fill( Number.NaN );
        this.colors.fill( '' );
    }
}
