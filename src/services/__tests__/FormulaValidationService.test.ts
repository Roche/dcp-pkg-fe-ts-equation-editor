import { TokenType } from "../../enums/TokenType";
import { MathOperator } from "../../enums/MathSymbols";
import { FormulaValidationService } from "../FormulaValidationService";
import { Operator } from "../../types/EquationEditor";

// Simple translation function for testing
const testTranslator = (key: string, payload?: Record<string, any>) => key;

describe('FormulaValidationService', () => {
    const service = new FormulaValidationService(1, testTranslator, 'prefix');
    const equationOperators: Operator[] = [
        { label: '=', value: '=', category: 'comparison', arity: 'binary', fixity: 'infix' },
        { label: 'between', value: 'between', category: 'comparison', arity: 'binary', fixity: 'infix', valueKind: 'range' },
        { label: 'in', value: 'in', category: 'comparison', arity: 'binary', fixity: 'infix', valueKind: 'list' },
        { label: 'notIn', value: 'notIn', category: 'comparison', arity: 'binary', fixity: 'infix', valueKind: 'list' }
    ];
    const equationService = new FormulaValidationService(1, testTranslator, 'prefix', 'equation', equationOperators);
    const equationServiceWithTwoComparisons = new FormulaValidationService(1, testTranslator, 'prefix', 'equation', equationOperators, 2);

    it('should detect unbalanced parentheses', () => {
        const tokens = [
            { type: TokenType.Parenthesis, value: '(' },
            { type: TokenType.Variable, value: 'x' }
        ];
        const errors = service.validateTokens(tokens);
        expect(errors.some(e => e.includes('unbalanced-parentheses'))).toBe(true);
    });

    it('should detect unbalanced brackets', () => {
        const tokens = [
            { type: TokenType.LeftBracket, value: '[' },
            { type: TokenType.Variable, value: 'x' }
        ];
        const errors = service.validateTokens(tokens);
        expect(errors.some(e => e.includes('unbalanced-brackets'))).toBe(true);
    });

    it('should detect consecutive variables', () => {
        const tokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Variable, value: 'y' }
        ];
        const errors = service.validateTokens(tokens);
        expect(errors.some(e => e.includes('consecutive'))).toBe(true);
    });

    it('should detect trailing operator', () => {
        const tokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.MathSymbol, value: MathOperator.Add }
        ];
        const errors = service.validateTokens(tokens);
        expect(errors.some(e => e.includes('ends-with-operator'))).toBe(true);
    });

    it('should detect unknown tokens', () => {
        const tokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Unknown, value: '???', unknown: true }
        ];

        const errors = service.validateTokens(tokens);
        expect(errors.some(e => e.includes('contains-unknown-token'))).toBe(true);
    });

    it('should enforce binary operator to have exactly two sides', () => {
        const tokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: '=' },
            { type: TokenType.Variable, value: 'y' },
            { type: TokenType.Operator, value: '=' },
            { type: TokenType.Variable, value: 'z' }
        ];

        const errors = equationService.validateTokens(tokens);
        expect(errors.some(e => e.includes('too-many-comparison-operators'))).toBe(true);
    });

    it('should allow two comparison operators when configured', () => {
        const tokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: '=' },
            { type: TokenType.Variable, value: 'y' },
            { type: TokenType.Operator, value: '=' },
            { type: TokenType.Variable, value: 'z' }
        ];

        const errors = equationServiceWithTwoComparisons.validateTokens(tokens);
        expect(errors.some(e => e.includes('too-many-comparison-operators'))).toBe(false);
    });

    it('should enforce between to have brackets with three sections', () => {
        // Invalid: between without brackets
        const invalidTokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'between' },
            { type: TokenType.Number, value: '10' },
            { type: TokenType.ArgumentSeparator, value: ',' },
            { type: TokenType.Number, value: '20' }
        ];

        const invalidErrors = equationService.validateTokens(invalidTokens);
        expect(invalidErrors.some(e => e.includes('between-requires-brackets'))).toBe(true);

        // Valid: between with brackets
        const validTokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'between' },
            { type: TokenType.LeftBracket, value: '[' },
            { type: TokenType.Number, value: '10' },
            { type: TokenType.ArgumentSeparator, value: ',' },
            { type: TokenType.Number, value: '20' },
            { type: TokenType.RightBracket, value: ']' }
        ];

        const validErrors = equationService.validateTokens(validTokens);
        expect(validErrors).toEqual([]);
    });

    it('should enforce in/notIn to have brackets', () => {
        // Invalid: in without brackets
        const invalidTokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'in' },
            { type: TokenType.Number, value: '1' }
        ];

        const invalidErrors = equationService.validateTokens(invalidTokens);
        expect(invalidErrors.some(e => e.includes('list-operator-requires-brackets'))).toBe(true);

        // Valid: in with brackets
        const validTokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'in' },
            { type: TokenType.LeftBracket, value: '[' },
            { type: TokenType.Number, value: '1' },
            { type: TokenType.ArgumentSeparator, value: ',' },
            { type: TokenType.Number, value: '2' },
            { type: TokenType.RightBracket, value: ']' }
        ];

        const validErrors = equationService.validateTokens(validTokens);
        expect(validErrors).toEqual([]);
    });

    it('should allow subtraction expression before between', () => {
        const tokens = [
            { type: TokenType.Variable, value: 'amount' },
            { type: TokenType.MathSymbol, value: MathOperator.Subtract },
            { type: TokenType.Number, value: '100' },
            { type: TokenType.Operator, value: 'between' },
            { type: TokenType.LeftBracket, value: '[' },
            { type: TokenType.Number, value: '-10' },
            { type: TokenType.ArgumentSeparator, value: ',' },
            { type: TokenType.Number, value: '100' },
            { type: TokenType.RightBracket, value: ']' }
        ];

        const errors = equationService.validateTokens(tokens);
        expect(errors).toEqual([]);
    });

    it('should require at least one comparison operator in equation mode', () => {
        // Invalid: no operator in equation mode
        const tokensWithoutOperator = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.MathSymbol, value: MathOperator.Add },
            { type: TokenType.Number, value: '5' }
        ];

        const errors = equationService.validateTokens(tokensWithoutOperator);
        expect(errors.some(e => e.includes('equation-requires-operator'))).toBe(true);
    });

    it('should not require an operator in formula mode', () => {
        // Valid: no operator in formula mode (just a math expression)
        const tokens = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.MathSymbol, value: MathOperator.Add },
            { type: TokenType.Number, value: '5' }
        ];

        const errors = service.validateTokens(tokens);
        expect(errors.some(e => e.includes('equation-requires-operator'))).toBe(false);
    });
});