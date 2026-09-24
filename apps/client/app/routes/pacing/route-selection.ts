import type { PacingReport } from '@slur/shared';
import { useSyncExternalStore } from 'react';
import { usePacingReport } from './pacing-report-context';

export interface ArmPick {
    report: PacingReport;
    fork: number;
    arm: number;
}

const listeners = new Set< () => void >();

let picked: ArmPick | null = null;

function subscribe( listener: () => void ): () => void {
    listeners.add( listener );
    return () => {
        listeners.delete( listener );
    };
}

function currentPick(): ArmPick | null {
    return picked;
}

export function togglePick( report: PacingReport, fork: number, arm: number ): void {
    const same = picked !== null && picked.report === report && picked.fork === fork && picked.arm === arm;
    picked = same ? null : { report, fork, arm };
    for ( const listener of listeners ) listener();
}

export function usePickedArm(): ArmPick | null {
    const report = usePacingReport();
    const pick = useSyncExternalStore( subscribe, currentPick, currentPick );
    return pick !== null && pick.report === report ? pick : null;
}

export function useArmPicked( fork: number, arm: number ): boolean {
    const report = usePacingReport();
    const isPicked = (): boolean =>
        picked !== null && picked.report === report && picked.fork === fork && picked.arm === arm;
    return useSyncExternalStore( subscribe, isPicked, isPicked );
}
