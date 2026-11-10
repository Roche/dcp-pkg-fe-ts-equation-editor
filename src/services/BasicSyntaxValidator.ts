import { FormulaToken, Operator, TranslationFunction } from "../types/EquationEditor";
import { TokenType } from "../enums/TokenType";
import { MathOperator } from "../enums/MathSymbols";
import { TokenValidationUtilities } from "./TokenValidationUtilities";

export class BasicSyntaxValidator extends TokenValidationUtilities {
    constructor(
        private minVariables: number,
        translator?: TranslationFunction,
        translationPrefix?: string
    ) {
        super(translator, translationPrefix);
    }

    checkParentheses(tokens: FormulaToken[]): string | null {
        const openParen = tokens.filter(t => t.type === TokenType.Parenthesis && t.value === '(').length;
        const closeParen = tokens.filter(t => t.type === TokenType.Parenthesis && t.value === ')').length;
        const openBracket = tokens.filter(t => t.type === TokenType.LeftBracket).length;
        const closeBracket = tokens.filter(t => t.type === TokenType.RightBracket).length;
        
        if (openParen !== closeParen) {
            return this.t("unbalanced-parentheses");
        }
        
        if (openBracket !== closeBracket) {
            return this.t("unbalanced-brackets");
        }
        
        return null;
    }

    checkStartOperator(tokens: FormulaToken[]): string | null {
        if (
            tokens[0] &&
            tokens[0].type === TokenType.MathSymbol &&
            [
                MathOperator.Add,
                MathOperator.Multiply,
                MathOperator.Divide
            ].includes(tokens[0].value as MathOperator)
        ) {
            return this.t("starts-with-operator");
        }
        return null;
    }

    checkConsecutiveVarsOrNums(tokens: FormulaToken[]): string | null {
        for (let i = 1; i < tokens.length; i++) {
            const prev = tokens[i - 1];
            const curr = tokens[i];
            const prevIsVarOrNum = prev.type === TokenType.Variable || prev.type === TokenType.Number;
            const currIsVarOrNum = curr.type === TokenType.Variable || curr.type === TokenType.Number;
            if (prevIsVarOrNum && currIsVarOrNum) {
                return this.t("consecutive-vars-ops-nums");
            }
        }
        return null;
    }

    checkMinVariables(tokens: FormulaToken[]): string | null {
        const variableCount = tokens.filter(t => t.type === 'variable').length;
        return variableCount < this.minVariables
            ? this.t("min-variables", { min: this.minVariables })
            : null;
    }

    checkTrailingOperator(tokens: FormulaToken[]): string | null {
        const last = tokens[tokens.length - 1];
        if (
            last &&
            last.type === TokenType.MathSymbol &&
            [
                MathOperator.Add,
                MathOperator.Multiply,
                MathOperator.Divide,
                MathOperator.Subtract
            ].includes(last.value as MathOperator)
        ) {
            return this.t("ends-with-operator");
        }
        return null;
    }

    checkConsecutiveOperators(tokens: FormulaToken[]): string | null {
        for (let i = 1; i < tokens.length; i++) {
            if (this.isAnyOperator(tokens[i - 1]) && this.isAnyOperator(tokens[i])) {
                return this.t("consecutive-operators");
            }
        }
        return null;
    }

    checkUnknownTokens(tokens: FormulaToken[]): string | null {
        const hasUnknown = tokens.some(token => token.type === TokenType.Unknown || token.unknown);
        return hasUnknown ? this.t("contains-unknown-token") : null;
    }
}
