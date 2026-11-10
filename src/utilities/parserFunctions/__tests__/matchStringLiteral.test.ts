import { matchStringLiteral } from '../matchStringLiteral';
import { TokenType } from '../../../enums/TokenType';

// Simple translation function for testing
const testTranslator = (key: string, payload?: Record<string, any>) => key;

describe('matchStringLiteral', () => {
    it('matches a quoted string', () => {
        const formula = '"hello"';
        const result = matchStringLiteral(formula, 0, testTranslator, 'prefix');
        expect(result.token).toEqual({ type: TokenType.String, value: '"hello"' });
        expect(result.nextIdx).toBe(7);
    });

    it('returns error for unclosed string', () => {
        const formula = '"hello';
        const result = matchStringLiteral(formula, 0, testTranslator, 'prefix');
        expect(result.token).toEqual({ type: TokenType.String, value: '"hello' });
        expect(result.error).toContain('unclosed-string-literal');
    });

    it('returns null if not a string literal', () => {
        const formula = 'x';
        const result = matchStringLiteral(formula, 0, testTranslator, 'prefix');
        expect(result.token).toBeNull();
    });
});