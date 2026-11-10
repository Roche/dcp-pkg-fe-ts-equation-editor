import { FormulaToken, Operator, TranslationFunction } from "../types/EquationEditor";
import { TokenType } from "../enums/TokenType";
import { MathOperator } from "../enums/MathSymbols";

export class TokenValidationUtilities {
    constructor(
        private translator?: TranslationFunction,
        private translationPrefix?: string
    ) {}

    protected t(key: string, payload: Record<string, any> = {}): string {
        if (this.translator && this.translationPrefix) {
            return this.translator(`${this.translationPrefix}.equation-editor.validations.${key}`, payload);
        }

        return 'Error: Missing translator or translationPrefix';
    }

    isAnyOperator(token: FormulaToken): boolean {
        return token.type === TokenType.MathSymbol || token.type === TokenType.Operator;
    }

    isValueStart(token: FormulaToken | undefined): boolean {
        if (!token) return false;

        return token.type === TokenType.Variable ||
            token.type === TokenType.Number ||
            token.type === TokenType.String ||
            token.type === TokenType.Function ||
            (token.type === TokenType.Parenthesis && token.value === '(');
    }

    isValueEnd(token: FormulaToken | undefined): boolean {
        if (!token) return false;

        return token.type === TokenType.Variable ||
            token.type === TokenType.Number ||
            token.type === TokenType.String ||
            (token.type === TokenType.Parenthesis && token.value === ')');
    }

    isSectionBoundary(token: FormulaToken | undefined): boolean {
        if (!token) return true;

        if (token.type === TokenType.Parenthesis && token.value === ')') {
            return true;
        }

        return false;
    }

    isUnaryMinusPosition(prev: FormulaToken | undefined): boolean {
        if (!prev) {
            return true;
        }

        if (this.isAnyOperator(prev)) {
            return true;
        }

        if (prev.type === TokenType.Parenthesis && prev.value === '(') {
            return true;
        }

        if (prev.type === TokenType.LeftBracket || prev.type === TokenType.ArgumentSeparator) {
            return true;
        }

        return false;
    }

    resolveOperator(token: FormulaToken, operatorsByValue: Map<string, Operator>): Operator {
        if (token.type === TokenType.MathSymbol) {
            return { label: token.value, value: token.value, category: 'math', arity: 'binary', fixity: 'infix' };
        }

        const known = operatorsByValue.get(token.value);
        if (known) {
            return {
                ...known,
                arity: known.arity || 'binary',
                fixity: known.fixity || 'infix'
            };
        }

        return { label: token.value, value: token.value, arity: 'binary', fixity: 'infix' };
    }
}
