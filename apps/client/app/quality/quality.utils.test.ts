import { describe, expect, it } from 'vitest';
import { PROFILES } from './quality.constants';
import { autoDpr, type DeviceProbe, declineBounds, detectTier, lowerTier, parseTier } from './quality.utils';

const DESKTOP: DeviceProbe = {
    webgl2: true,
    majorCaveat: false,
    renderer: 'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
    coarse: false,
    cores: 12,
    memoryGb: 16,
};

describe( 'parseTier (#344)', () => {
    it( 'accepts the three tiers and rejects anything else', () => {
        expect( parseTier( 'low' ) ).toBe( 'low' );
        expect( parseTier( 'medium' ) ).toBe( 'medium' );
        expect( parseTier( 'high' ) ).toBe( 'high' );
        expect( parseTier( 'ultra' ) ).toBeNull();
        expect( parseTier( null ) ).toBeNull();
    } );
} );

describe( 'detectTier (#344)', () => {
    it( 'gives a discrete desktop GPU high', () => {
        expect( detectTier( DESKTOP ) ).toBe( 'high' );
    } );

    it( 'gives a software renderer, a performance caveat or no WebGL2 low', () => {
        expect(
            detectTier( { ...DESKTOP, renderer: 'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))' } ),
        ).toBe( 'low' );
        expect( detectTier( { ...DESKTOP, renderer: 'Microsoft Basic Render Driver' } ) ).toBe( 'low' );
        expect( detectTier( { ...DESKTOP, majorCaveat: true } ) ).toBe( 'low' );
        expect( detectTier( { ...DESKTOP, webgl2: false } ) ).toBe( 'low' );
    } );

    it( 'gives an Intel UHD laptop low', () => {
        const uhd = 'ANGLE (Intel, Intel(R) UHD Graphics 620 Direct3D11 vs_5_0 ps_5_0, D3D11)';
        expect( detectTier( { ...DESKTOP, renderer: uhd, cores: 8, memoryGb: 8 } ) ).toBe( 'low' );
    } );

    it( 'gives an Iris Xe laptop medium', () => {
        const xe = 'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)';
        expect( detectTier( { ...DESKTOP, renderer: xe, cores: 8, memoryGb: 8 } ) ).toBe( 'medium' );
    } );

    it( 'gives a phone medium, and a low-memory phone low, whatever its core count', () => {
        const phone = { ...DESKTOP, renderer: 'Apple GPU', coarse: true, cores: 2, memoryGb: undefined };
        expect( detectTier( phone ) ).toBe( 'medium' );
        expect( detectTier( { ...phone, renderer: 'Mali-G57', memoryGb: 3 } ) ).toBe( 'low' );
    } );

    it( 'gives a desktop Mac high', () => {
        expect( detectTier( { ...DESKTOP, renderer: 'Apple M3 Pro' } ) ).toBe( 'high' );
    } );
} );

describe( 'lowerTier (#344)', () => {
    it( 'steps one tier down and stops at low', () => {
        expect( lowerTier( 'high' ) ).toBe( 'medium' );
        expect( lowerTier( 'medium' ) ).toBe( 'low' );
        expect( lowerTier( 'low' ) ).toBe( 'low' );
    } );
} );

describe( 'autoDpr (#344)', () => {
    it( 'caps the device ratio at the tier cap and never goes under 1', () => {
        expect( autoDpr( 3, PROFILES.high.dprCap ) ).toBe( 2 );
        expect( autoDpr( 3, PROFILES.medium.dprCap ) ).toBe( 1.5 );
        expect( autoDpr( 2, PROFILES.low.dprCap ) ).toBe( 1 );
        expect( autoDpr( 0.75, PROFILES.high.dprCap ) ).toBe( 1 );
    } );
} );

describe( 'declineBounds (#344)', () => {
    it( 'declines under 40 fps on 60 Hz and up, but not on a display locked to 30 Hz', () => {
        expect( declineBounds( 60 )[ 0 ] ).toBe( 40 );
        expect( declineBounds( 120 )[ 0 ] ).toBe( 40 );
        expect( declineBounds( 30 )[ 0 ] ).toBeLessThan( 30 );
    } );
} );
