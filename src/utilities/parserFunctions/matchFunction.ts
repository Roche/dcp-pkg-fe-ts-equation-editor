import { FormulaToken } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';

export function matchFunction(
    formula: string,
    i: number,
    sortedFuncs: string[],
    contextStack: string[]
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    let matchedFunc = '';
    for (const f of sortedFuncs) {
        if (formula.startsWith(f, i) && formula[i + f.length] === '(') {
            matchedFunc = f;
            break;
        }
    }
    if (matchedFunc) {
        contextStack.push('function'); // Enter function context
        return {
            token: { type: TokenType.Function, value: matchedFunc },
            nextIdx: i + matchedFunc.length
        };
    }
    return { token: null, nextIdx: i };
}