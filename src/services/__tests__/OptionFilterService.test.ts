import { TokenType } from "../../enums/TokenType";
import { MathOperator, Parenthesis } from "../../enums/MathSymbols";
import { OptionFilterService } from "../OptionFilterService";

describe('OptionFilterService', () => {
    const allOptions = {
        variables: [
            { label: 'x', value: 'x' },
            { label: 'y', value: 'y' }
        ],
        operators: [MathOperator.Add, MathOperator.Subtract, MathOperator.Multiply, MathOperator.Divide],
        parentheses: [Parenthesis.Open, Parenthesis.Close],
        functions: ['sin', 'cos']
    };

    it('should only allow subtract operator at start', () => {
        const options = OptionFilterService.getRelevantOptions([], allOptions);
        expect(options.operators).toEqual([MathOperator.Subtract]);
    });

    it('should hide open parenthesis after variable', () => {
        const tokens = [{ type: TokenType.Variable, value: 'x' }];
        const options = OptionFilterService.getRelevantOptions(tokens, allOptions);
        expect(options.parentheses).not.toContain(Parenthesis.Open);
    });

    it('should hide operators after operator', () => {
        const tokens = [{ type: TokenType.Operator, value: MathOperator.Add }];
        const options = OptionFilterService.getRelevantOptions(tokens, allOptions);
        expect(options.operators).toEqual([]);
    });

    it('should only allow subtract at start in equation mode', () => {
        const equationOptions = {
            ...allOptions,
            operators: [
                MathOperator.Add,
                MathOperator.Subtract,
                '=',
                '!='
            ]
        };

        const options = OptionFilterService.getRelevantOptions([], equationOptions, 'equation');
        expect(options.operators).toEqual([MathOperator.Subtract]);
    });

    it('should only allow subtract after open parenthesis in equation mode', () => {
        const equationOptions = {
            ...allOptions,
            operators: [
                MathOperator.Add,
                MathOperator.Subtract,
                MathOperator.Multiply,
                '=',
                '!='
            ]
        };

        const tokens = [{ type: TokenType.Parenthesis, value: Parenthesis.Open }];
        const options = OptionFilterService.getRelevantOptions(tokens, equationOptions, 'equation');
        expect(options.operators).toEqual([MathOperator.Subtract]);
    });

    it('should allow subtract after value in equation mode', () => {
        const equationOptions = {
            ...allOptions,
            operators: [
                MathOperator.Add,
                MathOperator.Subtract,
                MathOperator.Multiply,
                '='
            ]
        };

        const tokens = [{ type: TokenType.Variable, value: 'amount' }];
        const options = OptionFilterService.getRelevantOptions(tokens, equationOptions, 'equation');

        expect(options.operators).toContain(MathOperator.Subtract);
    });

    it('should only allow prefix operators at start when using operator metadata objects', () => {
        const equationOptions = {
            ...allOptions,
            operators: [
                { label: '-', value: '-', arity: 'unary-prefix' as const, fixity: 'prefix' as const },
                { label: '=', value: '=', arity: 'binary' as const, fixity: 'infix' as const },
                { label: 'isNull', value: 'isNull', arity: 'unary-postfix' as const, fixity: 'postfix' as const }
            ]
        };

        const options = OptionFilterService.getRelevantOptions([], equationOptions, 'equation');
        expect(options.operators).toEqual([{ label: '-', value: '-', arity: 'unary-prefix', fixity: 'prefix' }]);
    });

    it('should provide no options after postfix operators like isNull', () => {
        const equationOptions = {
            ...allOptions,
            operators: [
                MathOperator.Add,
                { label: 'isNull', value: 'isNull', arity: 'unary-postfix' as const, fixity: 'postfix' as const }
            ]
        };

        const tokens = [
            { type: TokenType.Variable, value: 'amount' },
            { type: TokenType.Operator, value: 'isNull' }
        ];

        const options = OptionFilterService.getRelevantOptions(tokens, equationOptions, 'equation');
        expect(options.variables).toEqual([]);
        expect(options.operators).toEqual([]);
        expect(options.parentheses).toEqual([]);
        expect(options.functions).toEqual([]);
    });

    it('should suggest opening bracket after list/range operators', () => {
        const equationOptions = {
            ...allOptions,
            operators: [
                { label: 'between', value: 'between', category: 'comparison' as const, arity: 'binary' as const, fixity: 'infix' as const },
                { label: 'in', value: 'in', category: 'comparison' as const, arity: 'binary' as const, fixity: 'infix' as const }
            ],
            brackets: ['[']
        };

        const betweenOptions = OptionFilterService.getRelevantOptions([
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'between' }
        ], equationOptions, 'equation');

        const inOptions = OptionFilterService.getRelevantOptions([
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'in' }
        ], equationOptions, 'equation');

        expect(betweenOptions.brackets).toEqual(['[']);
        expect(inOptions.brackets).toEqual(['[']);
        expect(betweenOptions.argumentSeparators).toEqual([]);
        expect(inOptions.argumentSeparators).toEqual([]);
        expect(betweenOptions.operators).toEqual([]);
        expect(inOptions.operators).toEqual([]);
    });

    it('should suggest closing bracket and separator after first between value', () => {
        const equationOptions = {
            ...allOptions,
            operators: [
                { label: 'between', value: 'between', category: 'comparison' as const, arity: 'binary' as const, fixity: 'infix' as const }
            ],
            brackets: ['['],
            argumentSeparators: [',']
        };

        const options = OptionFilterService.getRelevantOptions([
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'between' },
            { type: TokenType.LeftBracket, value: '[' },
            { type: TokenType.Number, value: '10' }
        ], equationOptions, 'equation');

        expect(options.brackets).toEqual([']', ',']);
        expect(options.argumentSeparators).toEqual([',']);
        expect(options.operators).toEqual([]);
    });

    it('should suggest only closing bracket after second between value', () => {
        const equationOptions = {
            ...allOptions,
            operators: [
                { label: 'between', value: 'between', category: 'comparison' as const, arity: 'binary' as const, fixity: 'infix' as const }
            ],
            brackets: ['['],
            argumentSeparators: [',']
        };

        const options = OptionFilterService.getRelevantOptions([
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'between' },
            { type: TokenType.LeftBracket, value: '[' },
            { type: TokenType.Number, value: '10' },
            { type: TokenType.ArgumentSeparator, value: ',' },
            { type: TokenType.Number, value: '20' }
        ], equationOptions, 'equation');

        expect(options.brackets).toEqual([']']);
        expect(options.argumentSeparators).toEqual([]);
        expect(options.operators).toEqual([]);
    });
});