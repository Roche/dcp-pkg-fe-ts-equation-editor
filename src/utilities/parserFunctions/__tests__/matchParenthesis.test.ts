import { matchParenthesis } from '../matchParenthesis';
import { TokenType } from '../../../enums/TokenType';

describe('matchParenthesis', () => {
    it('matches open parenthesis', () => {
        const formula = '(';
        const contextStack: string[] = [];
        const result = matchParenthesis(formula, 0, ['(', ')'], contextStack);
        expect(result.token).toEqual({ type: TokenType.Parenthesis, value: '(' });
        expect(contextStack).toContain('parenthesis');
    });

    it('matches close parenthesis and pops context', () => {
        const formula = ')';
        const contextStack: string[] = ['parenthesis'];
        const result = matchParenthesis(formula, 0, ['(', ')'], contextStack);
        expect(result.token).toEqual({ type: TokenType.Parenthesis, value: ')' });
        expect(contextStack.length).toBe(0);
    });

    it('returns null if not parenthesis', () => {
        const formula = 'x';
        const contextStack: string[] = [];
        const result = matchParenthesis(formula, 0, ['(', ')'], contextStack);
        expect(result.token).toBeNull();
    });
});