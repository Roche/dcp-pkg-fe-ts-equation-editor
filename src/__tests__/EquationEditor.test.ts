import { EquationEditor } from '../EquationEditor';
import { Operator, Variable } from '../types/EquationEditor';
import { TokenType } from '../enums/TokenType';
import { Parenthesis } from '../enums/MathSymbols';
import { firstValueFrom } from 'rxjs';

describe('EquationEditor', () => {
    const variables: Variable[] = [
        { label: 'x', value: '1' },
        { label: 'y', value: '2' }
    ];

    it('should initialize with empty tokens if no formula', () => {
        const editor = new EquationEditor(undefined, variables);
        expect(editor.getCurrentTokens()).toEqual([]);
    });

    it('should parse initial formula', () => {
        const editor = new EquationEditor('{x} + {y}', variables);
        expect(editor.getCurrentTokens().length).toBeGreaterThan(0);
        expect(editor.getCurrentTokens().map(t => t.value)).toContain('+');
    });

    it('should update formula and tokens', () => {
        const editor = new EquationEditor(undefined, variables);
        editor.updateFormula('{x} - {y}');
        expect(editor.getCurrentTokens().map(t => t.value)).toContain('-');
    });

    it('should clear tokens', () => {
        const editor = new EquationEditor('{x} + {y}', variables);
        editor.clear();
        expect(editor.getCurrentTokens()).toEqual([]);
    });

    it('should include equation operators in equation mode', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { mode: 'equation' });
        const options = editor.getNextOptionsFromTokens([{ type: TokenType.Variable, value: 'x' }]);
        const operatorValues = options.operators.map(op => typeof op === 'string' ? op : op.value);

        expect(operatorValues).toContain('!=');
        expect(operatorValues).not.toContain('AND');
        expect(operatorValues).not.toContain('OR');
        expect(operatorValues).not.toContain('NOT');
    });

    it('should expose extended comparison and text operators after a variable in equation mode', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { mode: 'equation' });
        const options = editor.getNextOptionsFromTokens([{ type: TokenType.Variable, value: 'x' }]);
        const operatorValues = options.operators.map(op => typeof op === 'string' ? op : op.value);

        expect(operatorValues).toContain('startsWith');
        expect(operatorValues).toContain('doesNotEndWith');
        expect(operatorValues).toContain('isNull');
        expect(operatorValues).toContain('between');
    });

    it('should include parser errors in valid$', async () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { failOnUnknown: true });
        editor.updateFormula('foo + {x}');

        const errors = await firstValueFrom(editor.valid$);
        expect(errors.some(e => e.includes('Unknown token block'))).toBe(true);
    });

    it('should hide additional infix comparison operators after reaching max comparison operator limit', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { mode: 'equation' });
        const options = editor.getNextOptionsFromTokens([
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: '=' },
            { type: TokenType.Variable, value: 'y' }
        ]);

        const operatorValues = options.operators.map(op => typeof op === 'string' ? op : op.value);
        expect(operatorValues).not.toContain('between');
        expect(operatorValues).not.toContain('=');
        expect(operatorValues).not.toContain('isNull');
        expect(operatorValues).not.toContain('empty');
        expect(operatorValues).toContain('+');
    });

    it('should provide no options after closing a between range when comparison limit is reached', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { mode: 'equation' });
        const options = editor.getNextOptionsFromTokens([
            { type: TokenType.Parenthesis, value: Parenthesis.Open },
            { type: TokenType.Variable, value: 'amount' },
            { type: TokenType.MathSymbol, value: '-' },
            { type: TokenType.Number, value: '100' },
            { type: TokenType.Parenthesis, value: Parenthesis.Close },
            { type: TokenType.Operator, value: 'between' },
            { type: TokenType.LeftBracket, value: '[' },
            { type: TokenType.Number, value: '-10' },
            { type: TokenType.ArgumentSeparator, value: ',' },
            { type: TokenType.Number, value: '100' },
            { type: TokenType.RightBracket, value: ']' }
        ]);

        expect(options.variables).toEqual([]);
        expect(options.operators).toEqual([]);
        expect(options.parentheses).toEqual([]);
        expect(options.functions).toEqual([]);
        expect(options.operatorGroups?.math).toEqual([]);
        expect(options.operatorGroups?.logical).toEqual([]);
    });

    it('should keep infix comparison operators available when max comparison limit is not reached', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, {
            mode: 'equation',
            maxComparisonOperatorsInEquation: 2
        });
        const options = editor.getNextOptionsFromTokens([
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: '=' },
            { type: TokenType.Variable, value: 'y' }
        ]);

        const operatorValues = options.operators.map(op => typeof op === 'string' ? op : op.value);
        expect(operatorValues).toContain('between');
    });

    it('should suggest opening bracket after between operator', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { mode: 'equation' });
        const options = editor.getNextOptionsFromTokens([
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'between' }
        ]);

        expect(options.brackets).toEqual(['[']);
        expect(options.operators).toEqual([]);
    });

    it('should suggest closing bracket and separator after first between boundary value', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { mode: 'equation' });
        const options = editor.getNextOptionsFromTokens([
            { type: TokenType.Variable, value: 'x' },
            { type: TokenType.Operator, value: 'between' },
            { type: TokenType.LeftBracket, value: '[' },
            { type: TokenType.Number, value: '10' }
        ]);

        expect(options.brackets).toEqual([']', ',']);
        expect(options.argumentSeparators).toEqual([',']);
    });

    it('should split operators into math and logical groups for visualization', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { mode: 'equation' });
        const groups = editor.getGroupedOperatorsFromTokens([{ type: TokenType.Variable, value: 'x' }]);

        const mathValues = groups.math.map(op => op.value);
        const logicalValues = groups.logical.map(op => op.value);

        expect(mathValues).toContain('+');
        expect(logicalValues).toContain('in');
        expect(logicalValues).toContain('between');
        expect(logicalValues).toContain('startsWith');
    });

    it('should expose grouped operators in getNextOptions payload', () => {
        const editor = new EquationEditor(undefined, variables, undefined, undefined, { mode: 'equation' });
        const options = editor.getNextOptionsFromTokens([{ type: TokenType.Variable, value: 'x' }]);

        expect(options.operatorGroups).toBeDefined();
        expect(options.operatorGroups?.math.some(op => op.value === '+')).toBe(true);
        expect(options.operatorGroups?.logical.some(op => op.value === 'in')).toBe(true);
    });

    it('should translate text operator labels when translator is configured', () => {
        const translator = (key: string) => {
            if (key === 'prefix.filter.operator.startsWith') {
                return 'Starts with (translated)';
            }
            return key;
        };

        const editor = new EquationEditor(undefined, variables, undefined, undefined, {
            mode: 'equation',
            translator,
            translationPrefix: 'prefix'
        });

        const options = editor.getNextOptionsFromTokens([{ type: TokenType.Variable, value: 'x' }]);
        const startsWith = options.operators
            .map(op => typeof op === 'string' ? undefined : op)
            .find(op => op?.value === 'startsWith');
        const equals = options.operators
            .map(op => typeof op === 'string' ? undefined : op)
            .find(op => op?.value === '=');

        expect(startsWith?.label).toBe('Starts with (translated)');
        expect(equals?.label).toBe('=');
    });

    it('should reparse the current formula when variables change', () => {
        const editor = new EquationEditor('{total}', [], undefined, undefined, { failOnUnknown: false });

        expect(editor.getCurrentTokens()[0]).toMatchObject({
            type: TokenType.Variable,
            value: 'total',
            unknown: true
        });

        editor.setVariables([{ label: 'total', value: '10' }]);

        expect(editor.getCurrentTokens()[0]).toMatchObject({
            type: TokenType.Variable,
            value: 'total',
            unknown: false
        });
        expect(editor.getFormulaDetailsFromTokens(editor.getCurrentTokens()).raw).toBe('10');
    });

    it('should reparse the current formula when functions change', () => {
        const editor = new EquationEditor('SUM({x})', variables, [], undefined, { failOnUnknown: false });

        expect(editor.getCurrentTokens()[0]?.type).toBe(TokenType.Unknown);

        editor.setFunctions(['SUM']);

        expect(editor.getCurrentTokens()[0]).toMatchObject({ type: TokenType.Function, value: 'SUM' });
    });

    it('should reparse the current formula when operators change', () => {
        const customOperator: Operator = {
            label: 'matchesAny',
            value: 'matchesAny',
            category: 'text',
            arity: 'binary',
            fixity: 'infix',
            valueKind: 'single',
            modes: ['equation']
        };
        const editor = new EquationEditor('{x} matchesAny "foo"', variables, undefined, undefined, {
            mode: 'equation',
            failOnUnknown: false
        });

        expect(editor.getCurrentTokens().some(token => token.value === 'matchesAny' && token.type === TokenType.Operator)).toBe(false);

        editor.setOperators([customOperator]);

        expect(editor.getCurrentTokens().some(token => token.value === 'matchesAny' && token.type === TokenType.Operator)).toBe(true);
    });

    it('should refresh grouped operators when config changes', () => {
        const editor = new EquationEditor('{x}', variables);

        expect(editor.getGroupedOperatorsForCurrentState().logical).toEqual([]);

        editor.updateConfig({ mode: 'equation' });

        expect(editor.getGroupedOperatorsForCurrentState().logical.some(operator => operator.value === 'in')).toBe(true);
    });

    it('should update variables and fences atomically through updateOptions', async () => {
        const editor = new EquationEditor('{count}', [{ label: 'count', value: '1' }]);

        editor.updateOptions({
            variables: [{ label: 'count', value: '42' }],
            config: {
                variableFenceOpen: '[',
                variableFenceClose: ']'
            }
        });

        expect(await firstValueFrom(editor.formula$)).toBe('[count]');
        expect(editor.getFormulaDetailsFromTokens(editor.getCurrentTokens()).raw).toBe('42');
    });

    describe('getter methods', () => {
        it('should return a copy of config', () => {
            const config = { mode: 'equation' as const, minVariables: 2 };
            const editor = new EquationEditor(undefined, variables, undefined, undefined, config);
            
            const retrievedConfig = editor.getConfig();
            expect(retrievedConfig.mode).toBe('equation');
            expect(retrievedConfig.minVariables).toBe(2);
            
            // Verify it's a copy (mutations don't affect original)
            retrievedConfig.minVariables = 999;
            expect(editor.getConfig().minVariables).toBe(2);
        });

        it('should return variables', () => {
            const editor = new EquationEditor(undefined, variables);
            const retrievedVariables = editor.getVariables();
            
            expect(retrievedVariables).toEqual(variables);
            expect(retrievedVariables.length).toBe(2);
        });

        it('should return functions', () => {
            const functions = ['sin', 'cos', 'sqrt'];
            const editor = new EquationEditor(undefined, variables, functions);
            
            expect(editor.getFunctions()).toEqual(functions);
        });

        it('should return operators', () => {
            const operators: Operator[] = [
                { label: 'AND', value: '&&', category: 'boolean' }
            ];
            const editor = new EquationEditor(undefined, variables, undefined, operators);
            
            expect(editor.getOperators()).toEqual(operators);
        });
    });

    describe('getFormulaDetailsFor', () => {
        it('should transform a different formula using same config', () => {
            const editor = new EquationEditor('{x} + {y}', variables);
            
            const details = editor.getFormulaDetailsFor('{x} * {y}');
            
            expect(details.display).toBe('{x} * {y}');
            expect(details.raw).toBe('1 * 2');
            expect(details.tokens).toBeDefined();
            expect(details.tokens!.length).toBe(3);
        });

        it('should allow overriding variables', () => {
            const editor = new EquationEditor('{x} + {y}', variables);
            
            const newVariables: Variable[] = [
                { label: 'a', value: '10' },
                { label: 'b', value: '20' }
            ];
            
            const details = editor.getFormulaDetailsFor('{a} + {b}', newVariables);
            
            expect(details.display).toBe('{a} + {b}');
            expect(details.raw).toBe('10 + 20');
        });

        it('should preserve config settings from original editor', () => {
            const editor = new EquationEditor(
                undefined, 
                variables, 
                undefined, 
                undefined, 
                { 
                    variableFenceOpen: '[[',
                    variableFenceClose: ']]'
                }
            );
            
            const details = editor.getFormulaDetailsFor('[[x]] + [[y]]');
            
            expect(details.display).toBe('[[x]] + [[y]]');
            expect(details.raw).toBe('1 + 2');
        });

        it('should work with functions from original editor', () => {
            const editor = new EquationEditor(
                undefined,
                variables,
                ['sin', 'cos']
            );
            
            const details = editor.getFormulaDetailsFor('sin({x})');
            
            expect(details.display).toBe('sin( {x} )');
            expect(details.tokens!.some(t => t.type === TokenType.Function)).toBe(true);
        });

        it('should work with custom operators from original editor', () => {
            const operators: Operator[] = [
                { label: 'AND', value: '&&', category: 'boolean' }
            ];
            const editor = new EquationEditor(
                undefined,
                variables,
                undefined,
                operators
            );
            
            const details = editor.getFormulaDetailsFor('{x} && {y}');
            
            expect(details.display).toContain('&&');
            expect(details.tokens!.some(t => t.value === '&&')).toBe(true);
        });
    });

    describe('static getFormulaDetails', () => {
        it('should transform formula without creating instance first', () => {
            const vars: Variable[] = [
                { label: 'SensorA', value: 'id_123' },
                { label: 'SensorB', value: 'id_456' }
            ];

            const details = EquationEditor.getFormulaDetails(
                '{SensorA} + {SensorB} = 10',
                vars
            );

            expect(details.display).toBe('{SensorA} + {SensorB} = 10');
            expect(details.unfancedDisplay).toBe('SensorA + SensorB = 10');
            expect(details.raw).toBe('id_123 + id_456 = 10');
            expect(details.fanciedRaw).toBe('{id_123} + {id_456} = 10');
        });

        it('should support custom config', () => {
            const vars: Variable[] = [
                { label: 'A', value: 'var_a' }
            ];

            const details = EquationEditor.getFormulaDetails(
                '[[A]] + 10',
                vars,
                undefined,
                undefined,
                {
                    variableFenceOpen: '[[',
                    variableFenceClose: ']]'
                }
            );

            expect(details.display).toBe('[[A]] + 10');
            expect(details.raw).toBe('var_a + 10');
        });

        it('should work with functions and operators', () => {
            const vars: Variable[] = [
                { label: 'Value', value: 'val_1' }
            ];

            const details = EquationEditor.getFormulaDetails(
                'sin({Value})',
                vars,
                ['sin']
            );

            expect(details.display).toBe('sin( {Value} )');
            expect(details.raw).toBe('sin( val_1 )');
            expect(details.tokens!.some(t => t.type === TokenType.Function)).toBe(true);
        });
    });
});