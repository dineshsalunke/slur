import { Component, type ReactNode } from 'react';

interface HdriBoundaryState {
    failed: boolean;
}

export class HdriBoundary extends Component< { children: ReactNode }, HdriBoundaryState > {
    state: HdriBoundaryState = { failed: false };

    static getDerivedStateFromError(): HdriBoundaryState {
        return { failed: true };
    }

    componentDidCatch( error: unknown ): void {
        console.warn( '[hdri] environment map failed to load', error );
    }

    render(): ReactNode {
        return this.state.failed ? null : this.props.children;
    }
}
