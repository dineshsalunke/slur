import * as THREE from 'three';
import { col, num } from '../../dev/tuning';
import { accent } from './accent';
import { FRACTURE_CORE_HEX } from './fractured-block-shader';
import { FAR_SEED, MAX_BOULDERS, MAX_CELLS, MAX_CRATERS } from './meteor-rock/meteor-rock.constants';
import type { MeteorShape } from './meteor-rock/meteor-rock.utils';
import { chainShaderPatch } from './shader-patch';

export const PIECE_LIMIT = MAX_CELLS;

export interface MeteorUniforms {
    uSeeds: { value: THREE.Vector3[] };
    uCells: { value: number };
    uJag: { value: number };
    uCraters: { value: THREE.Vector4[] };
    uCraterLook: { value: THREE.Vector2[] };
    uCraterN: { value: number };
    uBoulders: { value: THREE.Vector4[] };
    uBoulderN: { value: number };
    uStretch: { value: THREE.Vector3 };
    uSeedOff: { value: THREE.Vector3 };
    uRidges: { value: number };
    uCDepth: { value: number };
    uPatch: { value: number };
    uWidth: { value: number };
    uGlow: { value: number };
    uCore: { value: number };
    uHalo: { value: number };
    uHaloW: { value: number };
    uOccl: { value: number };
    uPulse: { value: number };
    uTime: { value: number };
    uAbl: { value: number };
    uInnerGlow: { value: number };
    uEdgeHeat: { value: number };
    uBump: { value: number };
    uBumpScale: { value: number };
    uRelief: { value: number };
    uFracGrain: { value: number };
    uHeatCol: { value: THREE.Color };
    uCoreCol: { value: THREE.Color };
    uFresh: { value: THREE.Color };
    uPieceMats: { value: THREE.Texture | null };
}

export function meteorUniforms(): MeteorUniforms {
    return {
        uSeeds: { value: Array.from( { length: MAX_CELLS }, () => new THREE.Vector3( FAR_SEED, FAR_SEED, FAR_SEED ) ) },
        uCells: { value: 0 },
        uJag: { value: 0 },
        uCraters: {
            value: Array.from( { length: MAX_CRATERS }, () => new THREE.Vector4( FAR_SEED, FAR_SEED, FAR_SEED, 0.01 ) ),
        },
        uCraterLook: { value: Array.from( { length: MAX_CRATERS }, () => new THREE.Vector2() ) },
        uCraterN: { value: 0 },
        uBoulders: {
            value: Array.from(
                { length: MAX_BOULDERS },
                () => new THREE.Vector4( FAR_SEED, FAR_SEED, FAR_SEED, 0.01 ),
            ),
        },
        uBoulderN: { value: 0 },
        uStretch: { value: new THREE.Vector3( 1, 1, 1 ) },
        uSeedOff: { value: new THREE.Vector3() },
        uRidges: { value: 0 },
        uCDepth: { value: 0 },
        uPatch: { value: 0 },
        uWidth: { value: 0.014 },
        uGlow: { value: 0 },
        uCore: { value: 0 },
        uHalo: { value: 0 },
        uHaloW: { value: 0.02 },
        uOccl: { value: 0 },
        uPulse: { value: 0 },
        uTime: { value: 0 },
        uAbl: { value: 0 },
        uInnerGlow: { value: 0 },
        uEdgeHeat: { value: 0 },
        uBump: { value: 1 },
        uBumpScale: { value: 1 },
        uRelief: { value: 1 },
        uFracGrain: { value: 1 },
        uHeatCol: { value: new THREE.Color() },
        uCoreCol: { value: new THREE.Color( FRACTURE_CORE_HEX ) },
        uFresh: { value: new THREE.Color() },
        uPieceMats: { value: null },
    };
}

export function applyShape( u: MeteorUniforms, s: MeteorShape ): void {
    for ( let i = 0; i < MAX_CELLS; i++ ) {
        const seed = s.seeds[ i ];
        if ( seed ) u.uSeeds.value[ i ].copy( seed );
        else u.uSeeds.value[ i ].setScalar( FAR_SEED );
    }
    u.uCells.value = s.seeds.length;
    u.uJag.value = s.jagged;
    for ( let i = 0; i < MAX_CRATERS; i++ ) {
        const c = s.craters[ i ];
        if ( c ) {
            u.uCraters.value[ i ].set( c.dir.x, c.dir.y, c.dir.z, c.radius );
            u.uCraterLook.value[ i ].set( c.rim, c.fresh );
        } else u.uCraters.value[ i ].set( FAR_SEED, FAR_SEED, FAR_SEED, 0.01 );
    }
    u.uCraterN.value = s.craters.length;
    for ( let i = 0; i < MAX_BOULDERS; i++ ) {
        const b = s.boulders[ i ];
        if ( b ) u.uBoulders.value[ i ].set( b.dir.x * b.height, b.dir.y * b.height, b.dir.z * b.height, b.radius );
        else u.uBoulders.value[ i ].set( FAR_SEED, FAR_SEED, FAR_SEED, 0.01 );
    }
    u.uBoulderN.value = s.boulders.length;
    u.uStretch.value.copy( s.stretch );
    u.uRidges.value = s.ridges;
    u.uSeedOff.value.set( ( s.offset * 0.0131 ) % 17, ( s.offset * 0.0071 ) % 13, ( s.offset * 0.0113 ) % 11 );
}

const VERT_HEAD = `
attribute vec3 aObj;
attribute float aInner;
attribute float aMeteorHeat;
varying vec3 vObj;
varying float vInner;
varying float vHeat;
varying float vScale;
varying float vLead;
#ifdef METEOR_PIECES
uniform sampler2D uPieceMats;
attribute float aPiece;
mat4 meteorPieceMatrix() {
	int col = int( aPiece + 0.5 ) * 4;
	int row = gl_InstanceID;
	return mat4(
		texelFetch( uPieceMats, ivec2( col, row ), 0 ),
		texelFetch( uPieceMats, ivec2( col + 1, row ), 0 ),
		texelFetch( uPieceMats, ivec2( col + 2, row ), 0 ),
		texelFetch( uPieceMats, ivec2( col + 3, row ), 0 ) );
}
#else
attribute vec3 aMeteorVel;
#endif
`;

const VERT_NORMAL = `
#include <beginnormal_vertex>
#ifdef METEOR_PIECES
mat4 meteorPiece = meteorPieceMatrix();
objectNormal = normalize( mat3( meteorPiece ) * objectNormal );
vScale = length( meteorPiece[ 0 ].xyz ) * length( instanceMatrix[ 0 ].xyz );
vLead = 0.0;
#else
vScale = length( instanceMatrix[ 0 ].xyz );
vLead = pow( max( dot( normalize( mat3( instanceMatrix ) * objectNormal ), aMeteorVel ), 0.0 ), 4.0 );
#endif
vObj = aObj;
vInner = aInner;
vHeat = aMeteorHeat;
`;

const VERT_POSITION = `
#include <begin_vertex>
#ifdef METEOR_PIECES
transformed = ( meteorPiece * vec4( transformed, 1.0 ) ).xyz;
#endif
`;

const FRAG_HEAD = `
uniform vec3 uSeeds[ ${ MAX_CELLS } ];
uniform int uCells;
uniform float uJag;
uniform vec4 uCraters[ ${ MAX_CRATERS } ];
uniform vec2 uCraterLook[ ${ MAX_CRATERS } ];
uniform int uCraterN;
uniform vec4 uBoulders[ ${ MAX_BOULDERS } ];
uniform int uBoulderN;
uniform vec3 uStretch;
uniform vec3 uSeedOff;
uniform float uRidges;
uniform float uCDepth;
uniform float uPatch;
uniform float uWidth;
uniform float uGlow;
uniform float uCore;
uniform float uHalo;
uniform float uHaloW;
uniform float uOccl;
uniform float uPulse;
uniform float uTime;
uniform float uAbl;
uniform float uInnerGlow;
uniform float uEdgeHeat;
uniform float uBump;
uniform float uBumpScale;
uniform float uRelief;
uniform float uFracGrain;
uniform vec3 uHeatCol;
uniform vec3 uCoreCol;
uniform vec3 uFresh;
varying vec3 vObj;
varying float vInner;
varying float vHeat;
varying float vScale;
varying float vLead;

void mCraterField( vec3 d, out float h, out float shade ) {
	h = 0.0;
	shade = 1.0;
	for ( int i = 0; i < ${ MAX_CRATERS }; i++ ) {
		if ( i >= uCraterN ) break;
		vec4 c = uCraters[ i ];
		float x = length( d - c.xyz ) / c.w;
		if ( x > 2.4 ) continue;
		vec2 look = uCraterLook[ i ];
		float bowl = x < 1.0 ? max( x * x - 1.0, -0.72 ) : 0.0;
		float rim = exp( -pow( ( x - 1.0 ) / 0.28, 2.0 ) ) * 0.35 * look.x;
		float ejecta = x > 1.0 ? 0.08 * exp( -( x - 1.0 ) * 2.5 ) : 0.0;
		h += ( bowl + rim + ejecta ) * c.w * uCDepth;
		if ( x < 1.0 ) shade *= 0.8 + 0.2 * x;
		shade += rim * 0.28 * ( 0.4 + look.y ) + ( x > 1.0 ? ejecta * look.y * 1.2 : 0.0 );
	}
	for ( int i = 0; i < ${ MAX_BOULDERS }; i++ ) {
		if ( i >= uBoulderN ) break;
		vec4 b = uBoulders[ i ];
		float lift = length( b.xyz );
		float x = length( d - b.xyz / lift ) / b.w;
		if ( x < 1.0 ) h += sqrt( 1.0 - x * x ) * b.w * lift;
	}
}

vec3 mWarp( vec3 p, float j ) {
	return p + j * 0.5 * vec3(
		sin( p.y * 7.1 + p.z * 3.3 ) + 0.5 * sin( p.z * 17.3 + p.x * 11.1 ),
		sin( p.z * 6.7 + p.x * 2.9 ) + 0.5 * sin( p.x * 15.7 + p.y * 13.9 ),
		sin( p.x * 7.9 + p.y * 3.7 ) + 0.5 * sin( p.y * 16.1 + p.z * 12.3 ) );
}

float mCellEdge( vec3 p ) {
	vec3 q = mWarp( p, uJag );
	float best = 1e9;
	vec3 a = vec3( 0.0 );
	for ( int i = 0; i < ${ MAX_CELLS }; i++ ) {
		if ( i >= uCells ) break;
		vec3 d = q - uSeeds[ i ];
		float dd = dot( d, d );
		if ( dd < best ) {
			best = dd;
			a = uSeeds[ i ];
		}
	}
	float e = 1e9;
	for ( int j = 0; j < ${ MAX_CELLS }; j++ ) {
		if ( j >= uCells ) break;
		vec3 n = uSeeds[ j ] - a;
		float len = length( n );
		if ( len < 1e-4 ) continue;
		e = min( e, dot( ( a + uSeeds[ j ] ) * 0.5 - q, n / len ) );
	}
	return e;
}

float mHash( vec3 p ) {
	p = fract( p * 0.3183099 + 0.1 );
	p *= 17.0;
	return fract( p.x * p.y * p.z * ( p.x + p.y + p.z ) );
}

float mNoise( vec3 x ) {
	vec3 i = floor( x );
	vec3 f = fract( x );
	f = f * f * ( 3.0 - 2.0 * f );
	return mix(
		mix( mix( mHash( i ), mHash( i + vec3( 1, 0, 0 ) ), f.x ), mix( mHash( i + vec3( 0, 1, 0 ) ), mHash( i + vec3( 1, 1, 0 ) ), f.x ), f.y ),
		mix( mix( mHash( i + vec3( 0, 0, 1 ) ), mHash( i + vec3( 1, 0, 1 ) ), f.x ), mix( mHash( i + vec3( 0, 1, 1 ) ), mHash( i + vec3( 1, 1, 1 ) ), f.x ), f.y ),
		f.z );
}

float mFbm( vec3 p ) {
	float a = 0.5;
	float t = 0.0;
	for ( int i = 0; i < 5; i++ ) {
		t += a * mNoise( p );
		p = p * 2.03 + vec3( 1.7, 9.2, 3.1 );
		a *= 0.5;
	}
	return t / 0.96875;
}

vec3 mPerturb( vec3 pos, vec3 n, vec2 dh, float fd ) {
	vec3 sx = dFdx( pos );
	vec3 sy = dFdy( pos );
	vec3 r1 = cross( sy, n );
	vec3 r2 = cross( n, sx );
	float det = dot( sx, r1 ) * fd;
	vec3 g = sign( det ) * ( dh.x * r1 + dh.y * r2 );
	return normalize( abs( det ) * n - g );
}
`;

const FRAG_COLOR = `
#include <color_fragment>
float mIn = clamp( vInner, 0.0, 1.0 );
float mRim = clamp( 2.0 - vInner, 0.0, 1.0 ) * mIn;
float mOuter = 1.0 - mIn;
vec3 mDir = normalize( vObj / uStretch + vec3( 1e-5 ) );
float mCrH;
float mCrS;
mCraterField( mDir, mCrH, mCrS );
float mPt = mFbm( mDir * 2.3 + uSeedOff );
float mWarm = mFbm( mDir * 1.3 + uSeedOff * 1.7 ) - 0.5;
vec3 mTint = vec3( 1.0 + 0.08 * mWarm, 1.0, 1.0 - 0.1 * mWarm ) * ( 1.0 + ( mPt - 0.5 ) * 1.3 * uPatch ) * mCrS;
float mEdge = mCellEdge( vObj );
float mLine = 1.0 - smoothstep( 0.0, uWidth, mEdge );
float mCoreL = 1.0 - smoothstep( 0.0, uWidth * 0.4, mEdge );
float mGrain = mFbm( vObj * 42.0 * uBumpScale );
float mSpeck = mNoise( vObj * 160.0 * uBumpScale );
vec3 mCrust = diffuseColor.rgb * mTint * ( 0.8 + 0.34 * mGrain ) * ( 0.9 + 0.2 * mSpeck );
vec3 fq = vObj * uBumpScale;
float fMot = mFbm( fq * 2.6 + 4.0 );
float fRough = abs( mNoise( fq * 26.0 ) * 2.0 - 1.0 );
float fPep = mNoise( fq * 140.0 );
float fGrain = mFbm( fq * 18.0 ) * 0.45 + mNoise( fq * 55.0 ) * 0.3 + fPep * 0.25;
vec3 mFresh = uFresh * ( 0.82 + 0.36 * fMot ) * ( 1.0 + ( fGrain - 0.5 ) * 0.5 * uFracGrain ) * ( 1.0 - 0.25 * fRough * uFracGrain );
mFresh *= 0.82 + 0.18 * smoothstep( 0.2, 0.8, fMot );
diffuseColor.rgb = mix( mCrust, mFresh, mIn );
diffuseColor.rgb *= 1.0 - mOuter * 0.82 * ( 1.0 - smoothstep( 0.0, uWidth * 2.6, mEdge ) );
`;

const FRAG_ROUGHNESS = `
#include <roughnessmap_fragment>
roughnessFactor = clamp( roughnessFactor + 0.08 * ( mGrain - 0.5 ), 0.6, 1.0 );
roughnessFactor = mix( roughnessFactor, clamp( 0.9 + 0.06 * ( fGrain - 0.5 ), 0.55, 0.96 ), mIn );
`;

const FRAG_NORMAL_BEGIN = `
#include <normal_fragment_begin>
vec3 mGeoN = normal;
`;

const FRAG_NORMAL = `
#include <normal_fragment_maps>
float mH = mFbm( vObj * 9.0 * uBumpScale ) * 0.55 + mFbm( vObj * 31.0 * uBumpScale ) * 0.3 + mNoise( vObj * 110.0 * uBumpScale ) * 0.15;
float fH = mFbm( fq * 4.0 ) * 0.5 + ( 1.0 - abs( mNoise( fq * 11.0 ) * 2.0 - 1.0 ) ) * 0.35 + mFbm( fq * 24.0 ) * 0.35 * uFracGrain + fRough * 0.22 * uFracGrain + fPep * 0.1 * uFracGrain;
mH = mix( mH, fH * 1.2 * uRelief, mIn );
mH *= 0.012 * uBump;
float mRg = 0.0;
float mAm = 0.125;
vec3 mRq = mDir * 13.2 + uSeedOff;
for ( int o = 0; o < 3; o++ ) {
	float nn = mNoise( mRq );
	mRg += mAm * pow( 1.0 - abs( 2.0 * nn - 1.0 ), 2.0 );
	mAm *= 0.5;
	mRq = mRq * 2.1 + 3.7;
}
mH += mOuter * ( mCrH + ( mRg - 0.08 ) * 0.22 * uRidges + ( mFbm( mDir * 7.0 + uSeedOff * 0.5 ) - 0.5 ) * 0.06 );
mH *= vScale;
normal = mPerturb( -vViewPosition, normal, vec2( dFdx( mH ), dFdy( mH ) ), faceDirection );
`;

const FRAG_EMISSIVE = `
#include <emissivemap_fragment>
vec3 mV = normalize( vViewPosition );
float mSee = mix( 1.0, pow( max( dot( mGeoN, mV ), 0.0 ), 2.5 ), uOccl );
float mGap = 0.3 + 0.7 * smoothstep( 0.35, 0.75, mNoise( vObj * 7.0 + 3.1 ) );
float mFlick = 0.88 + 0.12 * sin( uTime * uPulse + vObj.x * 9.0 + vObj.y * 5.0 + vObj.z * 3.0 );
vec3 mHot = mix( uHeatCol, uCoreCol, mCoreL * uCore );
float mCrackE = ( mCoreL * 0.6 + mLine * 0.4 + exp( -max( mEdge, 0.0 ) / uHaloW ) * uHalo * 0.12 ) * mGap * mSee;
vec3 mEm = mHot * mCrackE * uGlow * mFlick * mOuter;
mEm += mix( uHeatCol, uCoreCol, 0.35 ) * vLead * uAbl * mOuter * ( 0.6 + 0.4 * mGrain );
vec3 mEmIn = mix( uHeatCol, uCoreCol, 0.3 ) * pow( mRim, 14.0 ) * uEdgeHeat * mFlick;
float mVein = 0.5 + 0.5 * sin( vObj.x * 23.0 + sin( vObj.y * 17.0 ) * 2.0 + vObj.z * 19.0 );
mEmIn += mix( uHeatCol, uCoreCol, 0.2 + 0.5 * mVein ) * mIn * uInnerGlow * ( smoothstep( 0.45, 0.95, mVein ) + 0.12 ) * mFlick;
totalEmissiveRadiance += ( mEm + mEmIn ) * vHeat;
`;

export function tuneMeteor( u: MeteorUniforms, material: THREE.MeshStandardMaterial, now: number ): void {
    u.uTime.value = now;
    u.uCDepth.value = num( 'Meteor.craterDepth' );
    u.uPatch.value = num( 'Meteor.patchiness' );
    u.uWidth.value = num( 'Meteor.crackWidth' );
    u.uGlow.value = num( 'Meteor.crackGlow' );
    u.uCore.value = num( 'Meteor.crackCore' );
    u.uHalo.value = num( 'Meteor.halo' );
    u.uHaloW.value = num( 'Meteor.haloWidth' );
    u.uOccl.value = num( 'Meteor.fissureOcclusion' );
    u.uPulse.value = num( 'Meteor.pulse' );
    u.uAbl.value = num( 'Meteor.ablation' );
    u.uInnerGlow.value = num( 'Meteor.innerGlow' );
    u.uEdgeHeat.value = num( 'Meteor.edgeHeat' );
    u.uBump.value = num( 'Meteor.detail' );
    u.uBumpScale.value = num( 'Meteor.detailScale' );
    u.uRelief.value = num( 'Meteor.fractureRelief' );
    u.uFracGrain.value = num( 'Meteor.fractureGrain' );
    u.uHeatCol.value.copy( accent() );
    u.uFresh.value.set( col( 'Meteor.freshColor' ) );
    material.color.set( col( 'Meteor.rockColor' ) );
    material.roughness = num( 'Meteor.roughness' );
}

export function meteorMaterial( uniforms: MeteorUniforms, pieces: boolean ): THREE.MeshStandardMaterial {
    const material = new THREE.MeshStandardMaterial( { metalness: 0, roughness: 0.92, fog: false } );
    if ( pieces ) material.defines = { METEOR_PIECES: '' };
    chainShaderPatch( material, 'meteor', ( shader ) => {
        Object.assign( shader.uniforms, uniforms );
        shader.vertexShader =
            VERT_HEAD +
            shader.vertexShader
                .replace( '#include <beginnormal_vertex>', VERT_NORMAL )
                .replace( '#include <begin_vertex>', VERT_POSITION );
        shader.fragmentShader =
            FRAG_HEAD +
            shader.fragmentShader
                .replace( '#include <color_fragment>', FRAG_COLOR )
                .replace( '#include <roughnessmap_fragment>', FRAG_ROUGHNESS )
                .replace( '#include <normal_fragment_begin>', FRAG_NORMAL_BEGIN )
                .replace( '#include <normal_fragment_maps>', FRAG_NORMAL )
                .replace( '#include <emissivemap_fragment>', FRAG_EMISSIVE );
    } );
    material.customProgramCacheKey = () => ( pieces ? 'slur-meteor-pieces' : 'slur-meteor-head' );
    return material;
}
