import { AllOptions, EditorMode, FormulaToken, Operator } from '../types/EquationEditor';
import { MathOperator, Parenthesis } from '../enums/MathSymbols';
import { TokenType } from '../enums/TokenType';

export class OptionFilterService {
    private static readonly PREFIX_OPERATOR_VALUES = new Set<string>([
        MathOperator.Subtract
    ]);

    private static readonly POSTFIX_OPERATOR_VALUES = new Set<string>([
        'isNull',
        'isNotNull',
        'empty',
        'notEmpty',
        'isTrue',
        'isFalse'
    ]);

    private static readonly LIST_RANGE_OPERATORS = new Set<string>([
        'in',
        'notIn',
        'between',
        'notBetween'
    ]);

    private static readonly OPEN_BRACKET = '[';
    private static readonly CLOSE_BRACKET = ']';
    private static readonly ARGUMENT_SEPARATOR = ',';

    private static getOperatorValue(operator: MathOperator | string | Operator): string {
        return typeof operator === 'string' ? operator : operator.value;
    }

    private static getOperatorMeta(operator: MathOperator | string | Operator): Required<Pick<Operator, 'value' | 'fixity' | 'arity'>> {
        if (typeof operator === 'object') {
            return {
                value: operator.value,
                fixity: operator.fixity || 'infix',
                arity: operator.arity || 'binary'
            };
        }

        if (this.PREFIX_OPERATOR_VALUES.has(operator)) {
            return { value: operator, fixity: 'prefix', arity: 'unary-prefix' };
        }

        if (this.POSTFIX_OPERATOR_VALUES.has(operator)) {
            return { value: operator, fixity: 'postfix', arity: 'unary-postfix' };
        }

        return { value: operator, fixity: 'infix', arity: 'binary' };
    }

    private static isPrefixOperator(operator: MathOperator | string | Operator): boolean {
        const meta = this.getOperatorMeta(operator);
        if (meta.value === MathOperator.Subtract) {
            return true;
        }

        return meta.fixity === 'prefix' || meta.arity === 'unary-prefix';
    }

    private static isPostfixOperatorToken(
        token: FormulaToken | null,
        operators: (MathOperator | string | Operator)[]
    ): boolean {
        if (!token || (token.type !== TokenType.Operator && token.type !== TokenType.MathSymbol)) {
            return false;
        }

        const definedOperator = operators.find(op => this.getOperatorValue(op) === token.value);
        if (definedOperator) {
            const meta = this.getOperatorMeta(definedOperator);
            return meta.fixity === 'postfix' || meta.arity === 'unary-postfix';
        }

        return this.POSTFIX_OPERATOR_VALUES.has(token.value);
    }

    static getRelevantOptions(
        tokens: FormulaToken[],
        allOptions: AllOptions,
        mode: EditorMode = 'formula'
    ): AllOptions {
        const last = tokens.length ? tokens[tokens.length - 1] : null;

        let variables = allOptions.variables;
        let operators = allOptions.operators;
        let brackets = allOptions.brackets || [];
        let argumentSeparators = allOptions.argumentSeparators || [];
        let parentheses = allOptions.parentheses;
        let functions = allOptions.functions || [];

        // Support operator objects with visible()
        operators = operators.filter(op => {
            if (typeof op === 'object' && typeof op.visible === 'function') {
                return op.visible(last);
            }
            // Default: always visible
            return true;
        });

        if (this.isPostfixOperatorToken(last, operators)) {
            return {
                variables: [],
                operators: [],
                brackets: [],
                argumentSeparators: [],
                parentheses: [],
                functions: []
            };
        }

        // After list/range operators, only bracket is valid
        if (last && (last.type === TokenType.Operator || last.type === TokenType.MathSymbol)) {
            if (this.LIST_RANGE_OPERATORS.has(last.value)) {
                return {
                    variables: [],
                    operators: [],
                    brackets: [this.OPEN_BRACKET],
                    argumentSeparators: [],
                    parentheses: [],
                    functions: []
                };
            }
        }

        // After left bracket, allow values and functions
        if (last && last.type === TokenType.LeftBracket) {
            operators = [];
            parentheses = [];
            brackets = [];
            argumentSeparators = [];
            return { variables, operators, brackets, argumentSeparators, parentheses, functions };
        }

        // After a value inside brackets, allow separator or close bracket
        if (tokens.length >= 2) {
            const prev = tokens[tokens.length - 2];
            if ((last?.type === TokenType.Variable || last?.type === TokenType.Number || last?.type === TokenType.String) &&
                (prev.type === TokenType.LeftBracket || prev.type === TokenType.ArgumentSeparator)) {
                operators = [];
                parentheses = [];
                functions = [];
                const listRangeContext = this.getListRangeBracketContext(tokens);
                brackets = [this.CLOSE_BRACKET];

                if (listRangeContext && (listRangeContext.operatorValue === 'between' || listRangeContext.operatorValue === 'notBetween')) {
                    argumentSeparators = listRangeContext.separatorCount === 0
                        ? [this.ARGUMENT_SEPARATOR]
                        : [];
                } else {
                    argumentSeparators = [this.ARGUMENT_SEPARATOR];
                }

                if (argumentSeparators.length > 0) {
                    brackets = [...brackets, this.ARGUMENT_SEPARATOR];
                }

                return { variables: [], operators, brackets, argumentSeparators, parentheses, functions };
            }
        }

        // After argument separator inside brackets, allow values
        if (last && last.type === TokenType.ArgumentSeparator) {
            // Check if we're inside brackets
            let bracketDepth = 0;
            for (let i = tokens.length - 2; i >= 0; i--) {
                if (tokens[i].type === TokenType.RightBracket) bracketDepth++;
                if (tokens[i].type === TokenType.LeftBracket) {
                    bracketDepth--;
                    if (bracketDepth < 0) {
                        // We're inside brackets
                        operators = [];
                        parentheses = [];
                        brackets = [];
                        argumentSeparators = [];
                        return { variables, operators, brackets, argumentSeparators, parentheses, functions };
                    }
                }
            }
        }

        // At expression start, only prefix operators are valid.
        if (!last) {
            operators = operators.filter(op => this.isPrefixOperator(op));
            brackets = [];
            argumentSeparators = [];
        }

        if (last && last.type === TokenType.Variable) {
            variables = [];
            functions = [];
            parentheses = parentheses.filter(p => p !== Parenthesis.Open);
            brackets = [];
            argumentSeparators = [];
        }

        if (last && (last.type === TokenType.MathSymbol || last.type === TokenType.Operator)) {
            const canChainPrefix = this.PREFIX_OPERATOR_VALUES.has(last.value);
            operators = canChainPrefix
                ? operators.filter(op => this.isPrefixOperator(op))
                : [];
            brackets = [];
            argumentSeparators = [];
        }

        // After opening parenthesis, only prefix operators are valid.
        if (last && last.type === TokenType.Parenthesis && last.value === Parenthesis.Open) {
            operators = operators.filter(op => this.isPrefixOperator(op));
            brackets = [];
            argumentSeparators = [];
        }

        // After a value-like token, postfix operators should stay available.
        if (last && (last.type === TokenType.Variable || last.type === TokenType.Number || last.type === TokenType.String)) {
            operators = operators.filter(op => !this.isPrefixOperator(op) || this.getOperatorValue(op) === MathOperator.Subtract);
            brackets = [];
            argumentSeparators = [];
        }

        // Parentheses filtering
        const openCount = tokens.filter(t => t.type === TokenType.Parenthesis && t.value === Parenthesis.Open).length;
        const closeCount = tokens.filter(t => t.type === TokenType.Parenthesis && t.value === Parenthesis.Close).length;

        parentheses = parentheses.filter(p => {
            if (p === Parenthesis.Close) {
                // Only show closing parenthesis if there are more opens than closes
                // And last token is not a minus operator
                if (openCount <= closeCount) return false;
                if (last && last.type === TokenType.MathSymbol && last.value === MathOperator.Subtract) return false;
                if (last && last.type === TokenType.Operator && !this.POSTFIX_OPERATOR_VALUES.has(last.value)) return false;
            }
            return true;
        });

        return { variables, operators, brackets, argumentSeparators, parentheses, functions };
    }

    private static getListRangeBracketContext(tokens: FormulaToken[]): { operatorValue: string; separatorCount: number } | null {
        if (!tokens.length) {
            return null;
        }

        let bracketDepth = 0;

        for (let i = tokens.length - 1; i >= 0; i--) {
            const token = tokens[i];

            if (token.type === TokenType.RightBracket) {
                bracketDepth++;
                continue;
            }

            if (token.type === TokenType.LeftBracket) {
                if (bracketDepth === 0) {
                    const operatorToken = tokens[i - 1];
                    if (!operatorToken || !this.LIST_RANGE_OPERATORS.has(operatorToken.value)) {
                        return null;
                    }

                    let separatorCount = 0;
                    for (let j = i + 1; j < tokens.length; j++) {
                        const innerToken = tokens[j];
                        if (innerToken.type === TokenType.ArgumentSeparator) {
                            separatorCount++;
                        }
                    }

                    return {
                        operatorValue: operatorToken.value,
                        separatorCount
                    };
                }

                bracketDepth--;
            }
        }

        return null;
    }
}