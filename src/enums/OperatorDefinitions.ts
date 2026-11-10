import { MathOperator } from './MathSymbols';
import { EditorMode, Operator } from '../types/EquationEditor';

export const BUILT_IN_OPERATORS: Operator[] = [
    {
        label: MathOperator.Add,
        value: MathOperator.Add,
        category: 'math',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['formula', 'equation']
    },
    {
        label: MathOperator.Subtract,
        value: MathOperator.Subtract,
        category: 'math',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['formula', 'equation']
    },
    {
        label: MathOperator.Multiply,
        value: MathOperator.Multiply,
        category: 'math',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['formula', 'equation']
    },
    {
        label: MathOperator.Divide,
        value: MathOperator.Divide,
        category: 'math',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['formula', 'equation']
    },
    {
        label: '=',
        value: '=',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: '!=',
        value: '!=',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: '>',
        value: '>',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: '<',
        value: '<',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: '>=',
        value: '>=',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: '<=',
        value: '<=',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: 'in',
        value: 'in',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'list',
        modes: ['equation']
    },
    {
        label: 'notIn',
        value: 'notIn',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'list',
        modes: ['equation']
    },
    {
        label: 'between',
        value: 'between',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'range',
        modes: ['equation']
    },
    {
        label: 'notBetween',
        value: 'notBetween',
        category: 'comparison',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'range',
        modes: ['equation']
    },
    {
        label: 'isNull',
        value: 'isNull',
        category: 'comparison',
        arity: 'unary-postfix',
        fixity: 'postfix',
        valueKind: 'none',
        modes: ['equation']
    },
    {
        label: 'isNotNull',
        value: 'isNotNull',
        category: 'comparison',
        arity: 'unary-postfix',
        fixity: 'postfix',
        valueKind: 'none',
        modes: ['equation']
    },
    {
        label: 'empty',
        value: 'empty',
        category: 'comparison',
        arity: 'unary-postfix',
        fixity: 'postfix',
        valueKind: 'none',
        modes: ['equation']
    },
    {
        label: 'notEmpty',
        value: 'notEmpty',
        category: 'comparison',
        arity: 'unary-postfix',
        fixity: 'postfix',
        valueKind: 'none',
        modes: ['equation']
    },
    {
        label: 'contains',
        value: 'contains',
        category: 'text',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: 'doesNotContain',
        value: 'doesNotContain',
        category: 'text',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: 'startsWith',
        value: 'startsWith',
        category: 'text',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: 'doesNotStartWith',
        value: 'doesNotStartWith',
        category: 'text',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: 'endsWith',
        value: 'endsWith',
        category: 'text',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: 'doesNotEndWith',
        value: 'doesNotEndWith',
        category: 'text',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'single',
        modes: ['equation']
    },
    {
        label: 'matches',
        value: 'matches',
        category: 'text',
        arity: 'binary',
        fixity: 'infix',
        valueKind: 'pattern',
        modes: ['equation']
    },
    {
        label: 'isTrue',
        value: 'isTrue',
        category: 'boolean',
        arity: 'unary-postfix',
        fixity: 'postfix',
        valueKind: 'none',
        modes: ['equation']
    },
    {
        label: 'isFalse',
        value: 'isFalse',
        category: 'boolean',
        arity: 'unary-postfix',
        fixity: 'postfix',
        valueKind: 'none',
        modes: ['equation']
    }
];

export function getBuiltInOperatorsForMode(mode: EditorMode): Operator[] {
    return BUILT_IN_OPERATORS.filter(operator => {
        if (!operator.modes || operator.modes.length === 0) {
            return true;
        }

        return operator.modes.includes(mode);
    });
}

export function isMathOperatorValue(value: string): boolean {
    return Object.values(MathOperator).includes(value as MathOperator);
}
