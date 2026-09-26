import { FieldLabel } from '../../../ui/field-label';

export function CallSignField( { savedName }: { savedName: string } ) {
    return (
        <div className="flex min-w-0 flex-col gap-1.5">
            <FieldLabel htmlFor="callsign">Call sign</FieldLabel>
            <input
                id="callsign"
                name="name"
                type="text"
                defaultValue={ savedName }
                maxLength={ 16 }
                placeholder="Racer"
                autoComplete="nickname"
                spellCheck={ false }
                className="h-11 w-full border border-readout/20 bg-deep px-3.5 text-[16px] text-readout caret-marigold outline-none transition-colors duration-150 placeholder:text-readout-dim hover:border-readout/40 focus-visible:border-marigold"
            />
        </div>
    );
}
