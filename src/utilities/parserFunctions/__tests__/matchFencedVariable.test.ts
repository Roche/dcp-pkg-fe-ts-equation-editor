import { matchFencedVariable } from '../matchFencedVariable';
import { TokenType } from '../../../enums/TokenType';

// Simple translation function for testing
const testTranslator = (key: string, payload?: Record<string, any>) => key;

describe('matchFencedVariable', () => {
    it('matches fenced variable', () => {
        const formula = '{x}';
        const result = matchFencedVariable(formula, 0, '{', '}', ['x'], testTranslator, 'prefix');
        expect(result.token).toEqual({ type: TokenType.Variable, value: 'x', unknown: false });
        expect(result.nextIdx).toBe(3);
        expect(result.error).toBeUndefined();
    });

    it('returns error for unknown variable', () => {
        const formula = '{y}';
        const result = matchFencedVariable(formula, 0, '{', '}', ['x'], testTranslator, 'prefix');
        expect(result.token).toEqual({ type: TokenType.Variable, value: 'y', unknown: true });
        expect(result.error).toContain('unknown-variable');
    });

    it('returns error for unclosed fence', () => {
        const formula = '{x';
        const result = matchFencedVariable(formula, 0, '{', '}', ['x'], testTranslator, 'prefix');
        expect(result.token).toBeNull();
        expect(result.error).toContain('unclosed-variable-fence');
    });

    it('returns null if not fenced variable', () => {
        const formula = 'x';
        const result = matchFencedVariable(formula, 0, '{', '}', ['x'], testTranslator, 'prefix');
        expect(result.token).toBeNull();
    });
});