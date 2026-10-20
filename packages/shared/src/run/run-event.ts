declare const payload: unique symbol;

export type RunEvent< T > = string & { readonly [ payload ]?: T };

export type RunEventPayload< E > = E extends RunEvent< infer T > ? T : never;

export function runEvent< T >( type: string ): RunEvent< T > {
    return type;
}
