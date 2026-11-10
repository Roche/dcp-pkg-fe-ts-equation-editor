import { FormulaToken, Operator, EditorMode, TranslationFunction } from "../types/EquationEditor";
import { TokenType } from "../enums/TokenType";
import { MathOperator } from "../enums/MathSymbols";
import { TokenValidationUtilities } from "./TokenValidationUtilities";

export class OperatorValidator extends TokenValidationUtilities {
    constructor(
        private mode: EditorMode,
        private operatorsByValue: Map<string, Operator>,
        private maxComparisonOperatorsInEquation: number,
        translator?: TranslationFunction,
        translationPrefix?: string
    ) {
        super(translator, translationPrefix);
    }

    checkBetweenSections(tokens: FormulaToken[], operatorIndex: number): string | null {
        const current = tokens[operatorIndex];
        if (!(current.value === 'between' || current.value === 'notBetween')) {
            return null;
        }

        const nextToken = tokens[operatorIndex + 1];
        if (!nextToken || nextToken.type !== TokenType.LeftBracket) {
            return this.t("between-requires-brackets");
        }

        // Find matching closing bracket
        let bracketDepth = 1;
        let closeBracketIndex = -1;
        let separatorCount = 0;

        for (let i = operatorIndex + 2; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === TokenType.LeftBracket) {
                bracketDepth++;
                continue;
            }

            if (token.type === TokenType.RightBracket) {
                bracketDepth--;
                if (bracketDepth === 0) {
                    closeBracketIndex = i;
                    break;
                }
                continue;
            }

            if (bracketDepth === 1 && token.type === TokenType.ArgumentSeparator) {
                separatorCount++;
            }
        }

        if (closeBracketIndex === -1) {
            return this.t("unmatched-bracket");
        }

        // between requires exactly one separator (3 values: min, separator, max)
        if (separatorCount !== 1) {
            return this.t("between-requires-three-sections");
        }

        return null;
    }

    checkListBrackets(tokens: FormulaToken[], operatorIndex: number): string | null {
        const current = tokens[operatorIndex];
        if (!(current.value === 'in' || current.value === 'notIn')) {
            return null;
        }

        const nextToken = tokens[operatorIndex + 1];
        if (!nextToken || nextToken.type !== TokenType.LeftBracket) {
            return this.t("list-operator-requires-brackets");
        }

        // Find matching closing bracket
        let bracketDepth = 1;
        let closeBracketIndex = -1;

        for (let i = operatorIndex + 2; i < tokens.length; i++) {
            const token = tokens[i];

            if (token.type === TokenType.LeftBracket) {
                bracketDepth++;
                continue;
            }

            if (token.type === TokenType.RightBracket) {
                bracketDepth--;
                if (bracketDepth === 0) {
                    closeBracketIndex = i;
                    break;
                }
                continue;
            }
        }

        if (closeBracketIndex === -1) {
            return this.t("unmatched-bracket");
        }

        // Check that there's at least one value inside brackets
        const innerTokens = tokens.slice(operatorIndex + 2, closeBracketIndex);
        const hasValue = innerTokens.some(t => 
            t.type === TokenType.Variable || 
            t.type === TokenType.Number || 
            t.type === TokenType.String
        );

        if (!hasValue) {
            return this.t("list-requires-values");
        }

        return null;
    }

    checkMinComparisonOperators(tokens: FormulaToken[]): string | null {
        if (this.mode !== 'equation') {
            return null;
        }

        let comparisonCount = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (!this.isAnyOperator(token)) {
                continue;
            }

            const operator = this.resolveOperator(token, this.operatorsByValue);
            const isComparable = operator.category === 'comparison' || operator.category === 'text';

            if (isComparable && operator.fixity === 'infix') {
                comparisonCount++;
            }
        }

        if (comparisonCount === 0) {
            return this.t("equation-requires-operator");
        }

        return null;
    }

    checkComparisonSections(tokens: FormulaToken[]): string | null {
        if (this.mode !== 'equation') {
            return null;
        }

        if (this.maxComparisonOperatorsInEquation < 1) {
            return null;
        }

        let comparisonCount = 0;

        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];

            if (!this.isAnyOperator(token)) {
                continue;
            }

            const operator = this.resolveOperator(token, this.operatorsByValue);
            const isComparable = operator.category === 'comparison' || operator.category === 'text';

            if (isComparable && operator.fixity === 'infix') {
                comparisonCount++;
                if (comparisonCount > this.maxComparisonOperatorsInEquation) {
                    return this.t("too-many-comparison-operators");
                }
            }
        }

        return null;
    }

    checkOperatorPlacement(tokens: FormulaToken[]): string | null {
        for (let i = 0; i < tokens.length; i++) {
            const token = tokens[i];
            if (!this.isAnyOperator(token)) {
                continue;
            }

            const prev = tokens[i - 1];
            const next = tokens[i + 1];
            const isUnaryMinus = token.type === TokenType.MathSymbol && token.value === MathOperator.Subtract && this.isUnaryMinusPosition(prev);
            const operator = this.resolveOperator(token, this.operatorsByValue);

            if (isUnaryMinus || operator.fixity === 'prefix' || operator.arity === 'unary-prefix') {
                if (prev && !this.isAnyOperator(prev) && !(prev.type === TokenType.Parenthesis && prev.value === '(')) {
                    return this.t("invalid-operator-placement");
                }

                if (!this.isValueStart(next)) {
                    return this.t("invalid-operator-placement");
                }

                continue;
            }

            if (operator.fixity === 'postfix' || operator.arity === 'unary-postfix') {
                if (!this.isValueEnd(prev)) {
                    return this.t("invalid-operator-placement");
                }

                if (!this.isSectionBoundary(next)) {
                    return this.t("invalid-operator-placement");
                }

                continue;
            }

            if (token.value === 'in' || token.value === 'notIn') {
                if (!this.isValueEnd(prev)) {
                    return this.t("invalid-operator-placement");
                }

                const listError = this.checkListBrackets(tokens, i);
                if (listError) {
                    return listError;
                }

                continue;
            }

            if (token.value === 'between' || token.value === 'notBetween') {
                if (!this.isValueEnd(prev)) {
                    return this.t("invalid-operator-placement");
                }

                const betweenError = this.checkBetweenSections(tokens, i);
                if (betweenError) {
                    return betweenError;
                }

                continue;
            }

            if (!this.isValueEnd(prev) || !this.isValueStart(next)) {
                return this.t("invalid-operator-placement");
            }
        }

        return null;
    }
}
