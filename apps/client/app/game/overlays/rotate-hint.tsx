export function RotateHint() {
    return (
        <div className="fixed inset-0 z-[40] hidden flex-col items-center justify-center gap-3 bg-void/90 px-8 text-center font-readout text-readout uppercase tracking-[0.2em] pointer-coarse:portrait:flex">
            <span className="text-[28px] text-marigold">⟳</span>
            <span className="text-[14px]">Turn your phone sideways to race</span>
        </div>
    );
}
