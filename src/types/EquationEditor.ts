import { TokenType } from "../enums/TokenType";
import { MathOperator, Parenthesis } from '../enums/MathSymbols';

export type EditorMode = 'formula' | 'equation';
export type OperatorCategory = 'math' | 'comparison' | 'boolean' | 'text';
export type OperatorArity = 'binary' | 'unary-prefix' | 'unary-postfix';
export type OperatorFixity = 'infix' | 'prefix' | 'postfix';
export type OperatorValueKind = 'single' | 'none' | 'list' | 'range' | 'pattern';

export interface Operator {
    label: string;
    value: string;
    category?: OperatorCategory;
    arity?: OperatorArity;
    fixity?: OperatorFixity;
    valueKind?: OperatorValueKind;
    modes?: EditorMode[];
    visible?: (lastToken: FormulaToken | null) => boolean;
    data?: Record<string, any>;
}

export interface Variable {
    label: string;
    value: string;
    data?: Record<string, any>;
}

export interface FormulaDetails {
    raw: string;
    fanciedRaw: string;
    display: string;
    unfancedDisplay: string;
    tokens?: FormulaToken[];
    errors?: string[];
}

export interface FormulaToken {
    type: TokenType;
    value: string;
    unknown?: boolean;
    label?: string;
    functionName?: string;
    data?: Record<string, any>;
}

export interface AllOptions {
    variables: Variable[];
    operators: (MathOperator | string | Operator)[];
    operatorGroups?: OperatorVisualizationGroups;
    brackets?: string[];
    argumentSeparators?: string[];
    parentheses: Parenthesis[];
    functions?: string[];
}

export interface OperatorVisualizationGroups {
    math: Operator[];
    logical: Operator[];
}

export type TranslationFunction = (key: string, params?: Record<string, any>) => string;
export type CustomValidatorFunction = (formula: string, tokens: FormulaToken[]) => Promise<string[] | null> | string[] | null;

export interface EquationEditorConfig {
    mode?: EditorMode;
    maxComparisonOperatorsInEquation?: number;
    minVariables?: number;
    variableFenceOpen?: string;
    variableFenceClose?: string;
    numberFenceOpen?: string;
    numberFenceClose?: string;
    failOnUnknown?: boolean;
    translator?: TranslationFunction;
    translationPrefix?: string;
    customValidator?: CustomValidatorFunction;
    ignoreInternalErrors?: boolean;
}

export interface EquationEditorUpdateOptions {
    variables?: Variable[];
    functions?: string[];
    operators?: Operator[];
    config?: Partial<EquationEditorConfig>;
}