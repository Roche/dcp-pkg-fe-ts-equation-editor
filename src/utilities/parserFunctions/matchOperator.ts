import { FormulaToken } from '../../types/EquationEditor.js';
import { TokenType } from '../../enums/TokenType.js';

export function matchOperator(
    formula: string,
    i: number,
    operatorTokens: string[],
    userOperatorTokens: string[] = []
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    let matchedOp = '';
    for (const op of operatorTokens) {
        if (formula.startsWith(op, i)) {
            matchedOp = op;
            break;
        }
    }
    if (matchedOp) {
        const isUserOp = userOperatorTokens.includes(matchedOp);
        return {
            token: { type: isUserOp ? TokenType.Operator : TokenType.MathSymbol, value: matchedOp },
            nextIdx: i + matchedOp.length
        };
    }
    return { token: null, nextIdx: i };
}