import { button, useControls } from 'leva';
import {
    accentControl,
    colorControl,
    copyAccent,
    hdriLinkControl,
    numberControl,
    toneModeControl,
} from './tuning-panel.utils';

export function TuningPanel() {
    useControls( 'Accent', {
        color: accentControl(),
        'copy colour': button( copyAccent ),
    } );

    useControls( 'Render', {
        dpr: numberControl( 'Render.dpr' ),
        msaa: numberControl( 'Render.msaa' ),
        device: { value: String( devicePixelRatio ), editable: false },
    } );

    useControls( 'Tone mapping', {
        mode: toneModeControl(),
        exposure: numberControl( 'ToneMapping.exposure' ),
    } );

    useControls( 'Environment', {
        hdri: hdriLinkControl(),
        intensity: numberControl( 'Environment.intensity' ),
        rotation: numberControl( 'Environment.rotation' ),
        bandIntensity: numberControl( 'Environment.bandIntensity' ),
        bandHeight: numberControl( 'Environment.bandHeight' ),
    } );

    useControls( 'Bloom', {
        intensity: numberControl( 'Bloom.intensity' ),
        threshold: numberControl( 'Bloom.threshold' ),
        smoothing: numberControl( 'Bloom.smoothing' ),
    } );

    useControls( 'Metal', {
        baseColor: colorControl( 'Metal.baseColor' ),
        hullColor: colorControl( 'Hull.baseColor' ),
    } );

    useControls( 'Shadow', {
        color: colorControl( 'Shadow.color' ),
        opacity: numberControl( 'Shadow.opacity' ),
        size: numberControl( 'Shadow.size' ),
        spread: numberControl( 'Shadow.spread' ),
        softness: numberControl( 'Shadow.softness' ),
        blur: numberControl( 'Shadow.blur' ),
        reach: numberControl( 'Shadow.reach' ),
        lift: numberControl( 'Shadow.lift' ),
    } );

    useControls( 'Deck', {
        metalness: numberControl( 'Deck.metalness' ),
        roughness: numberControl( 'Deck.roughness' ),
        normalScale: numberControl( 'Deck.normalScale' ),
        plate: numberControl( 'Deck.plate' ),
        seamEmissive: numberControl( 'Deck.seamEmissive' ),
    } );

    useControls( 'Reflect', {
        blur: numberControl( 'Reflect.blur' ),
        warp: numberControl( 'Reflect.warp' ),
        grime: numberControl( 'Reflect.grime' ),
    } );

    useControls( 'Rail', {
        metalness: numberControl( 'Rail.metalness' ),
        roughness: numberControl( 'Rail.roughness' ),
        normalScale: numberControl( 'Rail.normalScale' ),
        railEmissive: numberControl( 'Rail.railEmissive' ),
        rimEmissive: numberControl( 'Rail.rimEmissive' ),
    } );

    useControls( 'Monolith', {
        seamEmissive: numberControl( 'Monolith.seamEmissive' ),
    } );

    useControls( 'Block', {
        seamEmissive: numberControl( 'Block.seamEmissive' ),
        wear: numberControl( 'Block.wear' ),
    } );

    useControls( 'Groove', {
        width: numberControl( 'Groove.width' ),
        wallTilt: numberControl( 'Groove.wallTilt' ),
        bevelShare: numberControl( 'Groove.bevelShare' ),
        metalness: numberControl( 'Groove.metalness' ),
        roughness: numberControl( 'Groove.roughness' ),
        darkening: numberControl( 'Groove.darkening' ),
        cavity: numberControl( 'Groove.cavity' ),
    } );

    useControls( 'Scratch', {
        density: numberControl( 'Scratch.density' ),
        lift: numberControl( 'Scratch.lift' ),
        tilt: numberControl( 'Scratch.tilt' ),
    } );

    useControls( 'Blotch', {
        dark: numberControl( 'Blotch.dark' ),
        bright: numberControl( 'Blotch.bright' ),
    } );

    useControls( 'Wear', {
        valueSpan: numberControl( 'Wear.valueSpan' ),
        roughSpan: numberControl( 'Wear.roughSpan' ),
        metalMin: numberControl( 'Wear.metalMin' ),
        metalMax: numberControl( 'Wear.metalMax' ),
    } );

    useControls( 'Exhaust', {
        length: numberControl( 'Exhaust.length' ),
        spread: numberControl( 'Exhaust.spread' ),
        glow: numberControl( 'Exhaust.glow' ),
        idle: numberControl( 'Exhaust.idle' ),
        softness: numberControl( 'Exhaust.softness' ),
        falloff: numberControl( 'Exhaust.falloff' ),
        heat: numberControl( 'Exhaust.heat' ),
        hot: colorControl( 'Exhaust.hot' ),
        cool: colorControl( 'Exhaust.cool' ),
    } );

    useControls( 'Portal', {
        membraneOpacity: numberControl( 'Portal.membraneOpacity' ),
        membraneGlow: numberControl( 'Portal.membraneGlow' ),
        membraneFlow: numberControl( 'Portal.membraneFlow' ),
    } );

    useControls( 'Hover', {
        base: numberControl( 'Hover.base' ),
        speedLift: numberControl( 'Hover.speedLift' ),
        follow: numberControl( 'Hover.follow' ),
        bob: numberControl( 'Hover.bob' ),
        bobRate: numberControl( 'Hover.bobRate' ),
    } );

    useControls( 'Seeker', {
        flyY: numberControl( 'Seeker.flyY' ),
    } );

    useControls( 'Pickup', {
        grabR: numberControl( 'Pickup.grabR' ),
    } );

    useControls( 'Chase camera', {
        back: numberControl( 'Chase.back' ),
        backStretch: numberControl( 'Chase.backStretch' ),
        height: numberControl( 'Chase.height' ),
        lookAhead: numberControl( 'Chase.lookAhead' ),
        lookAtLift: numberControl( 'Chase.lookAtLift' ),
        fov: numberControl( 'Chase.fov' ),
        fovStretch: numberControl( 'Chase.fovStretch' ),
        follow: numberControl( 'Chase.follow' ),
        boostBack: numberControl( 'Chase.boostBack' ),
        boostFov: numberControl( 'Chase.boostFov' ),
    } );

    useControls( 'Boost', {
        blur: numberControl( 'Boost.blur' ),
    } );

    useControls( 'Rock', {
        color: colorControl( 'Rock.color' ),
        textureScale: numberControl( 'Rock.textureScale' ),
        normalScale: numberControl( 'Rock.normalScale' ),
        roughness: numberControl( 'Rock.roughness' ),
        detail: numberControl( 'Rock.detail' ),
        spin: numberControl( 'Rock.spin' ),
        speed: numberControl( 'Rock.speed' ),
        cycle: numberControl( 'Rock.cycle' ),
        heat: numberControl( 'Rock.heat' ),
    } );

    useControls( 'Meteor', {
        chance: numberControl( 'Meteor.chance' ),
        speed: numberControl( 'Meteor.speed' ),
        size: numberControl( 'Meteor.size' ),
        flight: numberControl( 'Meteor.flight' ),
        ahead: numberControl( 'Meteor.ahead' ),
        trail: numberControl( 'Meteor.trail' ),
        spray: numberControl( 'Meteor.spray' ),
        chunks: numberControl( 'Meteor.chunks' ),
        shake: numberControl( 'Meteor.shake' ),
        ember: numberControl( 'Meteor.ember' ),
        cool: numberControl( 'Meteor.cool' ),
        seed: numberControl( 'Meteor.seed' ),
        cells: numberControl( 'Meteor.cells' ),
        jagged: numberControl( 'Meteor.jagged' ),
        elongation: numberControl( 'Meteor.elongation' ),
        lumps: numberControl( 'Meteor.lumps' ),
        ridges: numberControl( 'Meteor.ridges' ),
        craters: numberControl( 'Meteor.craters' ),
        craterSize: numberControl( 'Meteor.craterSize' ),
        craterDepth: numberControl( 'Meteor.craterDepth' ),
        boulders: numberControl( 'Meteor.boulders' ),
        patchiness: numberControl( 'Meteor.patchiness' ),
        detail: numberControl( 'Meteor.detail' ),
        detailScale: numberControl( 'Meteor.detailScale' ),
        roughness: numberControl( 'Meteor.roughness' ),
        rockColor: colorControl( 'Meteor.rockColor' ),
        crackWidth: numberControl( 'Meteor.crackWidth' ),
        crackGlow: numberControl( 'Meteor.crackGlow' ),
        crackCore: numberControl( 'Meteor.crackCore' ),
        fissureOcclusion: numberControl( 'Meteor.fissureOcclusion' ),
        halo: numberControl( 'Meteor.halo' ),
        haloWidth: numberControl( 'Meteor.haloWidth' ),
        pulse: numberControl( 'Meteor.pulse' ),
        build: numberControl( 'Meteor.build' ),
        ablation: numberControl( 'Meteor.ablation' ),
        fractureRelief: numberControl( 'Meteor.fractureRelief' ),
        fractureGrain: numberControl( 'Meteor.fractureGrain' ),
        freshColor: colorControl( 'Meteor.freshColor' ),
        edgeHeat: numberControl( 'Meteor.edgeHeat' ),
        innerGlow: numberControl( 'Meteor.innerGlow' ),
        fractureCool: numberControl( 'Meteor.fractureCool' ),
        lift: numberControl( 'Meteor.lift' ),
        carry: numberControl( 'Meteor.carry' ),
        tumble: numberControl( 'Meteor.tumble' ),
    } );

    useControls( 'Break', {
        speed: numberControl( 'Break.speed' ),
        up: numberControl( 'Break.up' ),
        carry: numberControl( 'Break.carry' ),
        spin: numberControl( 'Break.spin' ),
        gravity: numberControl( 'Break.gravity' ),
        bounce: numberControl( 'Break.bounce' ),
        friction: numberControl( 'Break.friction' ),
        spinDrag: numberControl( 'Break.spinDrag' ),
        flare: numberControl( 'Break.flare' ),
        cool: numberControl( 'Break.cool' ),
    } );

    useControls( 'Shake', {
        strength: numberControl( 'Shake.strength' ),
    } );

    return null;
}

export default TuningPanel;
