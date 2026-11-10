import { FormulaToken } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';
import { ArgumentSeparator } from '../../enums/MathSymbols';

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