import { LiteralStringDelimiters } from '../../enums/MathSymbols';
import { FormulaToken, TranslationFunction } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';

export function matchStringLiteral(
    formula: string,
    i: number,
    translator?: TranslationFunction,
    translationPrefix?: string
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    if (!LiteralStringDelimiters.includes(formula[i])) return { token: null, nextIdx: i };

    const t = (key: string, payload: Record<string, any> = {}): string => {
        if (translator && translationPrefix) {
            return translator(`${translationPrefix}.equation-editor.parsers.${key}`, payload);
        }
        return 'Error: Missing translator or translationPrefix';
    }

    const quoteType = formula[i];
    let endIdx = i + 1;
    let strValue = '';
    while (endIdx < formula.length && formula[endIdx] !== quoteType) {
        strValue += formula[endIdx];
        endIdx++;
    }

    if (endIdx < formula.length && formula[endIdx] === quoteType) {
        // Found closing quote
        return {
            token: { type: TokenType.String, value: quoteType + strValue + quoteType },
            nextIdx: endIdx + 1
        };
    } else {
        // Unclosed string
        return {
            token: { type: TokenType.String, value: quoteType + strValue },
            nextIdx: endIdx,
            error: t("unclosed-string-literal", { position: i })
        };
    }
}