import { QUALITY_TIERS, TIER_LABEL } from '../../../quality/quality.constants';
import { clearQualityTier, setQualityTier } from '../../../quality/quality.state';
import { useQuality } from '../../../quality/use-quality';
import { LABEL } from '../../../ui/field-label/field-label.constants';
import { PICK } from './quality-picker.constants';

export function QualityPicker() {
    const { tier, source, detected } = useQuality();
    const auto = source === 'auto';

    return (
        <fieldset className="m-0 flex min-w-0 flex-1 flex-col gap-1.5 border-0 p-0 lg:flex-none">
            <legend className={ `mb-1.5 flex p-0 ${ LABEL }` }>Graphics</legend>
            <div className="flex">
                <button
                    type="button"
                    aria-pressed={ auto }
                    title={ `Detected: ${ TIER_LABEL[ detected ] }` }
                    onClick={ clearQualityTier }
                    className={ PICK }
                >
                    Auto
                </button>
                { QUALITY_TIERS.map( ( t ) => (
                    <button
                        key={ t }
                        type="button"
                        aria-pressed={ ! auto && t === tier }
                        onClick={ () => setQualityTier( t ) }
                        className={ PICK }
                    >
                        { TIER_LABEL[ t ] }
                    </button>
                ) ) }
            </div>
        </fieldset>
    );
}
