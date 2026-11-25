import { FormulaToken } from '../../types/EquationEditor.js';
import { TokenType } from '../../enums/TokenType.js';
import { ArgumentSeparator } from '../../enums/MathSymbols.js';

export function matchArgumentSeparator(
    formula: string,
    i: number
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    if (formula[i] === ArgumentSeparator) {
        return {
            token: { type: TokenType.ArgumentSeparator, value: ArgumentSeparator },
            nextIdx: i + 1
        };
    }
    return { token: null, nextIdx: i };
}