import { matchArgumentSeparator } from '../matchArgumentSeparator.js';
import { TokenType } from '../../../enums/TokenType.js';
import { ArgumentSeparator } from '../../../enums/MathSymbols.js';

describe('matchArgumentSeparator', () => {
    it('matches comma as argument separator', () => {
        const formula = ',';
        const result = matchArgumentSeparator(formula, 0);
        expect(result.token).toEqual({ type: TokenType.ArgumentSeparator, value: ArgumentSeparator });
        expect(result.nextIdx).toBe(1);
    });

    it('returns null if not argument separator', () => {
        const formula = 'x';
        const result = matchArgumentSeparator(formula, 0);
        expect(result.token).toBeNull();
        expect(result.nextIdx).toBe(0);
    });
});