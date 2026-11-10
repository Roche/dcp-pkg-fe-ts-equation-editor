import { FormulaToken } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';

export function matchBracket(
    formula: string,
    i: number,
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    if (formula[i] === '[') {
        return {
            token: { type: TokenType.LeftBracket, value: '[' },
            nextIdx: i + 1
        };
    }
    if (formula[i] === ']') {
        return {
            token: { type: TokenType.RightBracket, value: ']' },
            nextIdx: i + 1
        };
    }
    return { token: null, nextIdx: i };
}
