import { TokenType } from '../enums/TokenType.js';
import { FormulaToken } from '../types/EquationEditor.js';

/** Renders a variable token. Default: `variableFenceOpen + token.value + variableFenceClose`. */
export type VariableTokenFormatter = (token: FormulaToken, variableFenceOpen: string, variableFenceClose: string) => string;

export function joinTokensNormalized(
    tokens: FormulaToken[],
    variableFenceOpen: string = '{',
    variableFenceClose: string = '}',
    numberFenceOpen: string | null = null,
    numberFenceClose: string | null = null,
    formatVariable?: VariableTokenFormatter
): string {
    let result = '';
    for (let i = 0; i < tokens.length; i++) {
        const t = tokens[i];

        // Fence variable tokens
        if (t.type === TokenType.Variable) {
            const rendered = formatVariable
                ? formatVariable(t, variableFenceOpen, variableFenceClose)
                : variableFenceOpen + t.value + variableFenceClose;
            result += (i > 0 ? ' ' : '') + rendered;
            continue;
        }

        // Fence number tokens if number fences are provided
        if (
            t.type === TokenType.Number &&
            numberFenceOpen !== null &&
            numberFenceClose !== null
        ) {
            result += (i > 0 ? ' ' : '') + numberFenceOpen + t.value + numberFenceClose;
            continue;
        }

        // If this is a function and next token is '(', join with no space
        if (
            t.type === TokenType.Function &&
            tokens[i + 1] &&
            tokens[i + 1].type === TokenType.Parenthesis &&
            tokens[i + 1].value === '('
        ) {
            result += t.value;
            continue;
        }
        // If this is '(' and previous token was a function, join with no space
        if (
            t.type === TokenType.Parenthesis &&
            t.value === '(' &&
            i > 0 &&
            tokens[i - 1].type === TokenType.Function
        ) {
            result += t.value;
            continue;
        }
        // Otherwise, add space before token (except first token)
        result += (i > 0 ? ' ' : '') + t.value;
    }
    return result;
}