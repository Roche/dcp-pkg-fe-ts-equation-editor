import { parseFormulaString } from '../parseFormulaString';
import { TokenType } from '../../enums/TokenType';
import { Operator } from '../../types/EquationEditor';

describe('parseFormulaString', () => {
    it('should parse simple formula', () => {
        const result = parseFormulaString('{x} + {y}', ['x', 'y']);
        expect(result.success).toBe(true);
        expect(result.tokens.length).toBeGreaterThan(0);
    });

    it('should fail on unknown token if failOnUnknown is true', () => {
        const result = parseFormulaString('foo + bar', ['x', 'y'], [], [], { failOnUnknown: true });
        expect(result.success).toBe(false);
        expect(result.errors?.length).toBeGreaterThan(0);
        expect(result.tokens.length).toBe(1);
        expect(result.tokens[0].type).toBe('unknown');
    });

    it('should not fail on unknown token if failOnUnknown is false', () => {
        const result = parseFormulaString('foo + bar', ['x', 'y'], [], [], { failOnUnknown: false });
        expect(result.success).toBe(false);
        expect(result.tokens.length).toBe(3);
        expect(result.tokens[0].type).toBe('unknown');
        expect(result.tokens[1].value).toBe('+');
        expect(result.tokens[2].type).toBe('unknown');
    });

    it('should parse brackets for list operators', () => {
        const operators: Operator[] = [
            { label: 'in', value: 'in', category: 'comparison', arity: 'binary', fixity: 'infix', valueKind: 'list', modes: ['equation'] }
        ];
        const result = parseFormulaString('{field} in [1, 2, 3]', ['field'], [], operators);
        expect(result.success).toBe(true);
        const tokens = result.tokens;
        expect(tokens.some(t => t.type === TokenType.LeftBracket)).toBe(true);
        expect(tokens.some(t => t.type === TokenType.RightBracket)).toBe(true);
    });

    it('should parse brackets for between operator', () => {
        const operators: Operator[] = [
            { label: 'between', value: 'between', category: 'comparison', arity: 'binary', fixity: 'infix', valueKind: 'range', modes: ['equation'] }
        ];
        const result = parseFormulaString('{field} between [10, 20]', ['field'], [], operators);
        expect(result.success).toBe(true);
        const tokens = result.tokens;
        expect(tokens.some(t => t.type === TokenType.LeftBracket)).toBe(true);
        expect(tokens.some(t => t.type === TokenType.RightBracket)).toBe(true);
    });

    it('should parse negative numbers in between range brackets', () => {
        const operators: Operator[] = [
            { label: 'between', value: 'between', category: 'comparison', arity: 'binary', fixity: 'infix', valueKind: 'range', modes: ['equation'] }
        ];
        const result = parseFormulaString('{field} between [-10, 50]', ['field'], [], operators);

        expect(result.success).toBe(true);
        expect(result.tokens.some(t => t.type === TokenType.Number && t.value === '-10')).toBe(true);
    });

    it('should keep subtraction tokenized when no spaces are used', () => {
        const result = parseFormulaString('{x}-3', ['x']);

        expect(result.success).toBe(true);
        expect(result.tokens.map(t => t.value)).toEqual(['x', '-', '3']);
    });

    it('should handle nested brackets', () => {
        const result = parseFormulaString('[1, 2]', []);
        expect(result.success).toBe(true);
        expect(result.tokens[0].type).toBe(TokenType.LeftBracket);
        expect(result.tokens[result.tokens.length - 1].type).toBe(TokenType.RightBracket);
    });
});