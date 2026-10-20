export interface CommandFormat< Input, Output > {
    readonly '~standard': {
        readonly version: 1;
        readonly vendor: 'slur';
        readonly validate: ( value: unknown ) => { readonly value: Output };
        readonly types?: { readonly input: Input; readonly output: Output };
    };
}

export function commandFormat< Input, Output >(
    normalise: ( value: unknown ) => Output,
): CommandFormat< Input, Output > {
    return {
        '~standard': {
            version: 1,
            vendor: 'slur',
            validate: ( value ) => ( { value: normalise( value ) } ),
        },
    };
}
