import { matchOperator } from '../matchOperator.js';
import { TokenType } from '../../../enums/TokenType.js';

describe('matchOperator', () => {
    it('matches built-in operator', () => {
        const formula = '+';
        const result = matchOperator(formula, 0, ['+', '-', '*', '/']);
        expect(result.token).toEqual({ type: TokenType.MathSymbol, value: '+' });
        expect(result.nextIdx).toBe(1);
    });

    it('matches user operator', () => {
        const formula = '%%';
        const result = matchOperator(formula, 0, ['%%'], ['%%']);
        expect(result.token).toEqual({ type: TokenType.Operator, value: '%%' });
        expect(result.nextIdx).toBe(2);
    });

    it('returns null if not operator', () => {
        const formula = 'x';
        const result = matchOperator(formula, 0, ['+', '-', '*', '/']);
        expect(result.token).toBeNull();
    });
});