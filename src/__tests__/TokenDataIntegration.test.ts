import { EquationEditor } from '../EquationEditor';
import { Variable, Operator } from '../types/EquationEditor';
import { TokenType } from '../enums/TokenType';

describe('Token Data Integration', () => {
    describe('Variable Token Data', () => {
        it('should enrich variable tokens with metadata from Variable definitions', (done) => {
            const variables: Variable[] = [
                { 
                    label: 'temperature', 
                    value: 'temp',
                    data: {
                        type: 'number',
                        description: 'Temperature in Celsius'
                    }
                },
                { 
                    label: 'pressure', 
                    value: 'pres',
                    data: {
                        type: 'number',
                        description: 'Pressure in Pascal'
                    }
                },
            ];

            const editor = new EquationEditor(
                '{temperature} + {pressure}',
                variables
            );

            editor.getTokens$().subscribe(tokens => {
                expect(tokens.length).toBe(3);

                // First token: temperature
                const tempToken = tokens[0];
                expect(tempToken.type).toBe(TokenType.Variable);
                expect(tempToken.value).toBe('temperature');
                expect(tempToken.data).toBeDefined();
                expect(tempToken.data?.type).toBe('number');
                expect(tempToken.data?.description).toBe('Temperature in Celsius');

                // Third token: pressure
                const presToken = tokens[2];
                expect(presToken.type).toBe(TokenType.Variable);
                expect(presToken.value).toBe('pressure');
                expect(presToken.data).toBeDefined();
                expect(presToken.data?.type).toBe('number');
                expect(presToken.data?.description).toBe('Pressure in Pascal');

                done();
            });
        });

        it('should handle variables with custom unit metadata', (done) => {
            const variables: Variable[] = [
                { 
                    label: 'distance', 
                    value: 'dist',
                    data: {
                        type: 'number',
                        description: 'Distance traveled'
                    }
                },
            ];

            const editor = new EquationEditor(
                '{distance}',
                variables
            );

            editor.getTokens$().subscribe(tokens => {
                const token = tokens[0];
                expect(token.data?.type).toBe('number');
                expect(token.data?.description).toBe('Distance traveled');
                
                // You can extend token data with custom properties
                // For example, if you want to add unit information later:
                // token.data.unit = 'meters';
                
                done();
            });
        });

        it('should update token data when variables change', (done) => {
            const initialVariables: Variable[] = [
                { label: 'x', value: 'x', data: { type: 'number' } },
            ];

            const editor = new EquationEditor('{x}', initialVariables);

            let callCount = 0;
            editor.getTokens$().subscribe(tokens => {
                callCount++;

                if (callCount === 1) {
                    // Initial state
                    expect(tokens[0].data?.type).toBe('number');
                    expect(tokens[0].data?.description).toBeUndefined();

                    // Update variables
                    editor.setVariables([
                        { label: 'x', value: 'x', data: { type: 'string', description: 'Updated description' } }
                    ]);
                } else if (callCount === 2) {
                    // After update
                    expect(tokens[0].data?.type).toBe('string');
                    expect(tokens[0].data?.description).toBe('Updated description');
                    done();
                }
            });
        });
    });

    describe('Operator Token Data', () => {
        it('should enrich operator tokens with category and arity', (done) => {
            const variables: Variable[] = [
                { label: 'x', value: 'x' },
                { label: 'y', value: 'y' }
            ];

            const customOperators: Operator[] = [
                {
                    label: 'Greater Than',
                    value: '>',
                    category: 'comparison',
                    arity: 'binary',
                    fixity: 'infix',
                    data: {
                        helpText: 'Compares two values'
                    }
                }
            ];

            const editor = new EquationEditor(
                '{x} > {y}',
                variables,
                [],
                customOperators,
                { mode: 'equation' }
            );

            editor.getTokens$().subscribe(tokens => {
                const operatorToken = tokens.find(t => t.type === TokenType.Operator);
                
                expect(operatorToken).toBeDefined();
                expect(operatorToken?.value).toBe('>');
                expect(operatorToken?.data).toBeDefined();
                expect(operatorToken?.data?.helpText).toBe('Compares two values');

                done();
            });
        });
    });

    describe('Function Token Data', () => {
        it('should allow custom function metadata', (done) => {
            const variables: Variable[] = [
                { label: 'x', value: 'x' }
            ];

            const editor = new EquationEditor(
                'SUM({x})',
                variables,
                ['SUM']
            );

            editor.getTokens$().subscribe(tokens => {
                const functionToken = tokens.find(t => t.type === TokenType.Function);
                
                expect(functionToken).toBeDefined();
                expect(functionToken?.value).toBe('SUM');
                // Function tokens don't get automatic enrichment
                // Users can add custom metadata as needed
                expect(functionToken?.data).toBeUndefined();

                done();
            });
        });
    });

    describe('Mixed Token Types', () => {
        it('should enrich all token types in a complex formula', (done) => {
            const variables: Variable[] = [
                { 
                    label: 'revenue', 
                    value: 'rev',
                    data: {
                        type: 'currency',
                        description: 'Total revenue'
                    }
                },
                { 
                    label: 'cost', 
                    value: 'cst',
                    data: {
                        type: 'currency',
                        description: 'Total cost'
                    }
                }
            ];

            const operators: Operator[] = [
                {
                    label: 'Greater Than',
                    value: '>',
                    category: 'comparison',
                    arity: 'binary',
                    data: {
                        priority: 10
                    }
                }
            ];

            const editor = new EquationEditor(
                'MAX({revenue}, {cost}) > 1000',
                variables,
                ['MAX'],
                operators,
                { mode: 'equation' }
            );

            editor.getTokens$().subscribe(tokens => {
                // Function token - no automatic enrichment
                const functionToken = tokens.find(t => t.type === TokenType.Function);
                expect(functionToken).toBeDefined();

                // Variable tokens
                const variableTokens = tokens.filter(t => t.type === TokenType.Variable);
                expect(variableTokens.length).toBe(2);
                expect(variableTokens[0].data?.type).toBe('currency');
                expect(variableTokens[1].data?.type).toBe('currency');

                // Operator token
                const operatorToken = tokens.find(t => t.type === TokenType.Operator);
                expect(operatorToken?.data?.priority).toBe(10);

                done();
            });
        });
    });

    describe('Backward Compatibility', () => {
        it('should not break when variables have no metadata', (done) => {
            const variables: Variable[] = [
                { label: 'x', value: 'x' },
                { label: 'y', value: 'y' }
            ];

            const editor = new EquationEditor('{x} + {y}', variables);

            editor.getTokens$().subscribe(tokens => {
                expect(tokens.length).toBe(3);
                
                // Tokens should still work even without metadata
                expect(tokens[0].type).toBe(TokenType.Variable);
                expect(tokens[0].value).toBe('x');
                expect(tokens[0].data).toBeUndefined();

                done();
            });
        });
    });
});
