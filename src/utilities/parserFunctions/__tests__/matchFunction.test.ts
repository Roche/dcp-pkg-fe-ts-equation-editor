import { matchFunction } from '../matchFunction';
import { TokenType } from '../../../enums/TokenType';

describe('matchFunction', () => {
    it('matches function followed by parenthesis', () => {
        const formula = 'sin(x)';
        const contextStack: string[] = [];
        const result = matchFunction(formula, 0, ['sin'], contextStack);
        expect(result.token).toEqual({ type: TokenType.Function, value: 'sin' });
        expect(result.nextIdx).toBe(3);
        expect(contextStack).toContain('function');
    });

    it('returns null if not a function', () => {
        const formula = 'cosx';
        const contextStack: string[] = [];
        const result = matchFunction(formula, 0, ['sin'], contextStack);
        expect(result.token).toBeNull();
    });
});