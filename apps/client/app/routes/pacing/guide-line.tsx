export function GuideLine( {
    value,
    duration,
    dashed = false,
}: {
    value: number;
    duration: number;
    dashed?: boolean;
} ) {
    return (
        <line
            x1={ 0 }
            x2={ duration }
            y1={ -value }
            y2={ -value }
            vectorEffect="non-scaling-stroke"
            strokeDasharray={ dashed ? '4 4' : undefined }
            className="stroke-threat/70 stroke-1"
        />
    );
}
