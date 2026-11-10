import { joinTokensNormalized } from '../joinTokensNormalized';
import { FormulaToken } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';

describe('joinTokensNormalized', () => {
    it('should join tokens with fenced variables', () => {
        const tokens: FormulaToken[] = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.MathSymbol, value: '+' },
            { type: TokenType.Variable, value: 'y' }
        ];
        const str = joinTokensNormalized(tokens);
        expect(str).toBe('{x} + {y}');
    });

    it('should join function and parenthesis without space', () => {
        const tokens: FormulaToken[] = [
            { type: TokenType.Function, value: 'sin' },
            { type: TokenType.Parenthesis, value: '(' },
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Parenthesis, value: ')' }
        ];
        const str = joinTokensNormalized(tokens);
        expect(str).toBe('sin( {x} )');
    });

    it('should fence numbers if number fences are provided', () => {
        const tokens: FormulaToken[] = [
            { type: TokenType.Number, value: '42' },
            { type: TokenType.MathSymbol, value: '+' },
            { type: TokenType.Number, value: '7' }
        ];
        const str = joinTokensNormalized(tokens, '{', '}', '[', ']');
        expect(str).toBe('[42] + [7]');
    });

    it('should not fence numbers if number fences are not provided', () => {
        const tokens: FormulaToken[] = [
            { type: TokenType.Number, value: '42' },
            { type: TokenType.MathSymbol, value: '+' },
            { type: TokenType.Number, value: '7' }
        ];
        const str = joinTokensNormalized(tokens);
        expect(str).toBe('42 + 7');
    });

    it('should mix variable and number fencing', () => {
        const tokens: FormulaToken[] = [
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.MathSymbol, value: '+' },
            { type: TokenType.Number, value: '10' }
        ];
        const str = joinTokensNormalized(tokens, '{', '}', '[', ']');
        expect(str).toBe('{x} + [10]');
    });
});