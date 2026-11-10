import { FormulaToken, TranslationFunction } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';

export function matchFencedVariable(
    formula: string,
    i: number,
    variableFenceOpen: string,
    variableFenceClose: string,
    sortedVars: string[],
    translator?: TranslationFunction,
    translationPrefix?: string
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    if (!formula.startsWith(variableFenceOpen, i)) return { token: null, nextIdx: i };

    const t = (key: string, payload: Record<string, any> = {}): string => {
        if (translator && translationPrefix) {
            return translator(`${translationPrefix}.equation-editor.parsers.${key}`, payload);
        }
        return 'Error: Missing translator or translationPrefix';
    }

    const closeIdx = formula.indexOf(variableFenceClose, i + variableFenceOpen.length);
    if (closeIdx === -1) {
        return {
            token: null,
            nextIdx: i + variableFenceOpen.length,
            error: t("unclosed-variable-fence", { position: i })
        };
    }

    const varName = formula.slice(i + variableFenceOpen.length, closeIdx);
    let error;
    if (!sortedVars.includes(varName)) {
        error = t("unknown-variable", { varName, i });
    }

    return {
        token: { type: TokenType.Variable, value: varName, unknown: !!error },
        nextIdx: closeIdx + variableFenceClose.length,
        error
    };
}