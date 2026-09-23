import * as THREE from 'three';
import { num } from '../../dev/tuning';
import { skyDirection } from './sky-config';

const DEG = Math.PI / 180;
const MOON_SPREAD = [
    [ -58, -12 ],
    [ 14, -10 ],
] as const;
const MOON_SCALE = [ 1, 0.7 ] as const;

const _up = new THREE.Vector3();
const _right = new THREE.Vector3();

export interface PlanetUniforms {
    uPlanetDir: { value: THREE.Vector3 };
    uPlanetSin: { value: number };
    uPlanetSun: { value: THREE.Vector3 };
    uPlanetLight: { value: number };
    uPlanetGlow: { value: number };
    uPlanetRelief: { value: number };
    uMoonDir: { value: THREE.Vector3[] };
    uMoonSin: { value: number[] };
}

export function planetUniforms(): PlanetUniforms {
    return {
        uPlanetDir: { value: new THREE.Vector3( 0, 0, 1 ) },
        uPlanetSin: { value: 0 },
        uPlanetSun: { value: new THREE.Vector3( 0, 1, 0 ) },
        uPlanetLight: { value: 1 },
        uPlanetGlow: { value: 1 },
        uPlanetRelief: { value: 1 },
        uMoonDir: { value: MOON_SPREAD.map( () => new THREE.Vector3( 0, 0, 1 ) ) },
        uMoonSin: { value: MOON_SPREAD.map( () => 0 ) },
    };
}

function aimSun( toward: THREE.Vector3, phase: number, tilt: number, out: THREE.Vector3 ): void {
    _up.set( 0, 1, 0 ).addScaledVector( toward, -toward.y ).normalize();
    _right.crossVectors( toward, _up );
    out.copy( toward )
        .multiplyScalar( -Math.cos( phase ) )
        .addScaledVector( _up, Math.sin( phase ) * Math.cos( tilt ) )
        .addScaledVector( _right, Math.sin( phase ) * Math.sin( tilt ) )
        .normalize();
}

export function applyPlanets( u: PlanetUniforms ): void {
    const azimuth = num( 'Sky.planetAzimuth' );
    const elevation = num( 'Sky.planetElevation' );
    u.uPlanetDir.value.fromArray( skyDirection( azimuth, elevation ) );
    u.uPlanetSin.value = Math.sin( num( 'Sky.planetSize' ) * DEG );
    aimSun( u.uPlanetDir.value, num( 'Sky.planetPhase' ) * DEG, num( 'Sky.planetTilt' ) * DEG, u.uPlanetSun.value );
    u.uPlanetLight.value = num( 'Sky.planetLight' );
    u.uPlanetGlow.value = num( 'Sky.planetGlow' );
    u.uPlanetRelief.value = num( 'Sky.planetRelief' );
    const moons = num( 'Sky.moons' );
    const moonSin = Math.sin( num( 'Sky.moonSize' ) * DEG );
    for ( let i = 0; i < MOON_SPREAD.length; i++ ) {
        const [ dAz, dEl ] = MOON_SPREAD[ i ];
        u.uMoonDir.value[ i ].fromArray( skyDirection( azimuth + dAz, elevation + dEl ) );
        u.uMoonSin.value[ i ] = i < moons ? moonSin * MOON_SCALE[ i ] : 0;
    }
}
