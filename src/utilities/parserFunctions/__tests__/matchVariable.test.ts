import { matchVariable } from '../matchVariable';
import { TokenType } from '../../../enums/TokenType';

describe('matchVariable', () => {
    it('matches variable from sortedVars', () => {
        const formula = 'abc';
        const result = matchVariable(formula, 0, ['abc', 'a']);
        expect(result.token).toEqual({ type: TokenType.Variable, value: 'abc' });
        expect(result.nextIdx).toBe(3);
    });

    it('returns null if no variable matches', () => {
        const formula = 'xyz';
        const result = matchVariable(formula, 0, ['abc', 'a']);
        expect(result.token).toBeNull();
        expect(result.nextIdx).toBe(0);
    });
});