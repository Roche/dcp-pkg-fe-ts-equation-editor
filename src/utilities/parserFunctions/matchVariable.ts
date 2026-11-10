import { FormulaToken } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';

export function matchVariable(
    formula: string,
    i: number,
    sortedVars: string[]
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    let matchedVar = '';
    for (const v of sortedVars) {
        if (formula.startsWith(v, i)) {
            matchedVar = v;
            break;
        }
    }
    if (matchedVar) {
        return {
            token: { type: TokenType.Variable, value: matchedVar },
            nextIdx: i + matchedVar.length
        };
    }
    return { token: null, nextIdx: i };
}