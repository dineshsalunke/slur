import { Fragment } from 'react';
import { LegendSwatch } from '../legend-swatch';

export function PacingStripLegend() {
    return (
        <Fragment>
            <LegendSwatch swatchClass="bg-dim" label="sealed block" />
            <LegendSwatch swatchClass="bg-marigold" label="fractured block" />
            <LegendSwatch swatchClass="bg-void outline outline-line-2" label="hole" />
            <LegendSwatch swatchClass="bg-fg/10" label="intended band" />
            <LegendSwatch swatchClass="bg-magenta/40" label="pinch" />
            <LegendSwatch swatchClass="bg-cyan/25" label="viable hull centre" />
            <LegendSwatch swatchClass="bg-threat/40" label="dead end" />
            <LegendSwatch swatchClass="outline outline-dashed outline-marigold" label="opens with a bolt" />
            <LegendSwatch swatchClass="bg-cyan" label="easiest route" />
            <LegendSwatch swatchClass="bg-magenta" label="hardest route" />
            <LegendSwatch swatchClass="bg-marigold" label="picked arm" />
            <LegendSwatch swatchClass="bg-gold" label="airborne / pickup" />
            <span className="pt-1">top = left (+x)</span>
        </Fragment>
    );
}
