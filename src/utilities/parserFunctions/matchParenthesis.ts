import { FormulaToken } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';

export function matchParenthesis(
    formula: string,
    i: number,
    parenthesisTokens: string[],
    contextStack: string[]
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    let matchedPar = '';
    for (const par of parenthesisTokens) {
        if (formula.startsWith(par, i)) {
            matchedPar = par;
            break;
        }
    }
    if (matchedPar) {
        // Update context stack
        if (matchedPar === '(') {
            contextStack.push('parenthesis');
        } else if (matchedPar === ')') {
            // Pop until matching open
            while (contextStack.length) {
                const popped = contextStack.pop();
                if (popped === 'parenthesis' || popped === 'function') break;
            }
        }
        return {
            token: { type: TokenType.Parenthesis, value: matchedPar },
            nextIdx: i + matchedPar.length
        };
    }
    return { token: null, nextIdx: i };
}