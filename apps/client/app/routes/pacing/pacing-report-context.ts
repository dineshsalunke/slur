import type { PacingReport } from '@slur/shared';
import { createContext, use } from 'react';

export const PacingReportContext = createContext< PacingReport | null >( null );

export function usePacingReport(): PacingReport {
    const report = use( PacingReportContext );
    if ( ! report ) throw new Error( 'usePacingReport needs a PacingReportContext provider' );
    return report;
}
