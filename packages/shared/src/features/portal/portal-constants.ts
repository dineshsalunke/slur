export const PORTAL_HOP_MESSAGE = 'portalHop';
export const PORTAL_FIZZLE_MESSAGE = 'portalFizzle';

export interface PortalHopMessage {
    fromX: number;
    fromY: number;
    fromZ: number;
    x: number;
    y: number;
    z: number;
    victimId: string;
}

export interface PortalFizzleMessage {
    x: number;
    y: number;
    z: number;
    ownerId: string;
}

export const PORTAL_RATIO = 0.1;

export interface PortalConfig {
    portalR: number;
    portalY: number;
    portalRideY: number;
    portalNearLeadS: number;
    portalFarS: number;
    portalBackGap: number;
    portalArmS: number;
    portalTtl: number;
    portalDoubleTapTicks: number;
    portalClearW: number;
    portalClearHalfL: number;
    portalExitGap: number;
    portalFinishGap: number;
    portalZStep: number;
    portalRatio: number;
}

export const DEFAULT_PORTAL_CONFIG: PortalConfig = {
    portalR: 5,
    portalY: 3,
    portalRideY: 0.8,
    portalNearLeadS: 0.4,
    portalFarS: 1,
    portalBackGap: 1,
    portalArmS: 0.3,
    portalTtl: 9,
    portalDoubleTapTicks: 15,
    portalClearW: 12,
    portalClearHalfL: 11.5,
    portalExitGap: 0.5,
    portalFinishGap: 20,
    portalZStep: 1,
    portalRatio: PORTAL_RATIO,
};
