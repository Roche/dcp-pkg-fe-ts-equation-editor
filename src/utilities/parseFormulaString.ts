import { MathOperator, Parenthesis } from '../enums/MathSymbols';
import { matchStringLiteral } from './parserFunctions/matchStringLiteral';
import { matchFencedVariable } from './parserFunctions/matchFencedVariable';
import { matchFunction } from './parserFunctions/matchFunction';
import { matchVariable } from './parserFunctions/matchVariable';
import { matchNumber } from './parserFunctions/matchNumber';
import { matchArgumentSeparator } from './parserFunctions/matchArgumentSeparator';
import { matchOperator } from './parserFunctions/matchOperator';
import { matchParenthesis } from './parserFunctions/matchParenthesis';
import { matchBracket } from './parserFunctions/matchBracket';
import { TokenType } from '../enums/TokenType';
import { FormulaToken, Operator, TranslationFunction } from '../types/EquationEditor';

export interface ParseFormulaResult {
    success: boolean;
    tokens: FormulaToken[];
    errors?: string[];
}

export function parseFormulaString(
    formula: string,
    variableNames: string[] = [],
    functionNames: string[] = [],
    operators: Operator[] = [],
    options?: {
        variableFenceOpen?: string;
        variableFenceClose?: string;
        numberFenceOpen?: string;
        numberFenceClose?: string;
        failOnUnknown?: boolean;
        translator?: TranslationFunction;
        translationPrefix?: string;
    },
): ParseFormulaResult {
    const sortedVars = [...variableNames].sort((a, b) => b.length - a.length);
    const sortedFuncs = [...functionNames].sort((a, b) => b.length - a.length);
    const builtInOperatorTokens = Object.values(MathOperator);
    const userOperatorTokens = operators.map(op => op.value);
    const operatorTokens = [...builtInOperatorTokens, ...userOperatorTokens].sort((a, b) => b.length - a.length);
    const parenthesisTokens = Object.values(Parenthesis);

    const variableFenceOpen = options?.variableFenceOpen || '{';
    const variableFenceClose = options?.variableFenceClose || '}';
    const numberFenceOpen = options?.numberFenceOpen ?? null;
    const numberFenceClose = options?.numberFenceClose ?? null;
    const failOnUnknown = options?.failOnUnknown ?? true;

    const result: FormulaToken[] = [];
    const errors: string[] = [];
    let i = 0;

    // Track context: stack of { type: 'function' | 'parenthesis' }
    const contextStack: Array<'function' | 'parenthesis'> = [];

    const matchers = [
        (formula: string, i: number) => matchStringLiteral(formula, i, options?.translator, options?.translationPrefix),
        (formula: string, i: number) => matchFencedVariable(formula, i, variableFenceOpen, variableFenceClose, sortedVars, options?.translator, options?.translationPrefix),
        (formula: string, i: number) => matchFunction(formula, i, sortedFuncs, contextStack),
        (formula: string, i: number) => matchVariable(formula, i, sortedVars),
        (formula: string, i: number) => matchNumber(formula, i, numberFenceOpen, numberFenceClose, options?.translator, options?.translationPrefix),
        (formula: string, i: number) => matchArgumentSeparator(formula, i),
        (formula: string, i: number) => matchOperator(formula, i, operatorTokens, userOperatorTokens),
        (formula: string, i: number) => matchParenthesis(formula, i, parenthesisTokens, contextStack),
        (formula: string, i: number) => matchBracket(formula, i),
    ];

    let inUnknownContext = false;

    function tryMatchers(formula: string, idx: number): { matched: boolean; nextIdx: number } {
        for (const matcher of matchers) {
            const resultObj = matcher(formula, idx);
            if (resultObj.token) {
                result.push(resultObj.token);
                if (resultObj.error) errors.push(resultObj.error);
                return { matched: true, nextIdx: resultObj.nextIdx };
            }
        }
        return { matched: false, nextIdx: idx };
    }

    function handleUnknownContext(formula: string, idx: number): number {
        const unknownStart = idx;
        let unknownStr = '';
        while (
            idx < formula.length &&
            !/\s/.test(formula[idx]) &&
            formula[idx] !== '(' &&
            formula[idx] !== ')' &&
            formula[idx] !== '[' &&
            formula[idx] !== ']'
        ) {
            unknownStr += formula[idx];
            idx++;
        }
        if (unknownStr.length > 0) {
            errors.push(`Unknown token block at position ${unknownStart}: '${unknownStr}'`);
            result.push({ type: TokenType.Unknown, value: unknownStr, unknown: true });
            if (failOnUnknown) {
                return -1; // Signal to exit early
            }
        }
        return idx;
    }

    while (i < formula.length) {
        // Skip whitespace
        if (/\s/.test(formula[i])) {
            i++;
            inUnknownContext = false;
            continue;
        }

        // Exit unknown context on parenthesis or brackets
        if (inUnknownContext && (formula[i] === '(' || formula[i] === ')' || formula[i] === '[' || formula[i] === ']')) {
            inUnknownContext = false;
        }

        if (!inUnknownContext) {
            const { matched, nextIdx } = tryMatchers(formula, i);
            if (matched) {
                i = nextIdx;
                continue;
            }
            inUnknownContext = true;
        }

        if (inUnknownContext) {
            const nextIdx = handleUnknownContext(formula, i);
            if (nextIdx === -1) {
                return { success: false, errors, tokens: result };
            }
            i = nextIdx;
            inUnknownContext = false;
            continue;
        }
    }


    if (errors.length > 0) {
        return { success: false, errors, tokens: result };
    }

    return { success: true, tokens: result.filter(token => token.value.trim().length > 0) };
}