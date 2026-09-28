import {
    asteriskCensorStrategy,
    englishDataset,
    englishRecommendedTransformers,
    RegExpMatcher,
    TextCensor,
} from 'obscenity';

export const GAME_WORDS: readonly string[] = [ 'slur', 'cockpit', 'cockpits' ];
export const NAME_FALLBACK = '';

const dataset = englishDataset.build();
const matcher = new RegExpMatcher( {
    ...dataset,
    ...englishRecommendedTransformers,
    whitelistedTerms: [ ...( dataset.whitelistedTerms ?? [] ), ...GAME_WORDS ],
} );
const censor = new TextCensor().setStrategy( asteriskCensorStrategy() );

export function stripInvisible( text: string ): string {
    return text.replace( /[\p{Cc}\p{Cf}]/gu, '' );
}

export function maskProfanity( text: string ): string {
    const matches = matcher.getAllMatches( text, true );
    return matches.length ? censor.applyTo( text, matches ) : text;
}

export function cleanName( raw: unknown ): string {
    if ( typeof raw !== 'string' ) return NAME_FALLBACK;
    const name = stripInvisible( raw ).replace( /\s+/gu, ' ' ).trim();
    return matcher.hasMatch( name ) ? NAME_FALLBACK : name;
}

export function cleanChat( text: string ): string {
    return maskProfanity( stripInvisible( text ) ).trim();
}
