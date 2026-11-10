import { FormulaToken, TranslationFunction } from '../../types/EquationEditor';
import { TokenType } from '../../enums/TokenType';

export function matchNumber(
    formula: string,
    i: number,
    numberFenceOpen?: string | null,
    numberFenceClose?: string | null,
    translator?: TranslationFunction,
    translationPrefix?: string
): {
    token: FormulaToken | null,
    nextIdx: number,
    error?: string
} {
    const unsignedNumberRegex = /^\d+(\.\d+)?/;
    const fencedNumberRegex = /^-?\d+(\.\d+)?$/;

    const canTreatAsUnaryMinus = (source: string, index: number): boolean => {
        if (source[index] !== '-') {
            return false;
        }

        let j = index - 1;
        while (j >= 0 && /\s/.test(source[j])) {
            j--;
        }

        if (j < 0) {
            return true;
        }

        return ['(', '[', ',', '+', '-', '*', '/', '^'].includes(source[j]);
    };

    const t = (key: string, payload: Record<string, any> = {}): string => {
        if (translator && translationPrefix) {
            return translator(`${translationPrefix}.equation-editor.parsers.${key}`, payload);
        }
        return 'Error: Missing translator or translationPrefix';
    }

    // Check for fenced number first
    if (
        numberFenceOpen &&
        numberFenceClose &&
        formula.startsWith(numberFenceOpen, i)
    ) {
        const fenceStart = i + numberFenceOpen.length;
        const fenceEnd = formula.indexOf(numberFenceClose, fenceStart);
        if (fenceEnd > fenceStart) {
            const numStr = formula.slice(fenceStart, fenceEnd).replace(/,/g, '.');
            if (fencedNumberRegex.test(numStr)) {
                return {
                    token: { type: TokenType.Number, value: numStr },
                    nextIdx: fenceEnd + numberFenceClose.length
                };
            } else {
                return {
                    token: null,
                    nextIdx: fenceEnd + numberFenceClose.length,
                    error: t("invalid-number-in-fence", { position: i, value: numStr })
                };
            }
        }
    }
    // Fallback: normal number matching
    const isNegativeCandidate = formula[i] === '-' && canTreatAsUnaryMinus(formula, i);
    const sliceStart = isNegativeCandidate ? i + 1 : i;
    const numMatch = formula.slice(sliceStart).match(unsignedNumberRegex);

    if (numMatch) {
        const value = isNegativeCandidate ? `-${numMatch[0]}` : numMatch[0];
        return {
            token: { type: TokenType.Number, value },
            nextIdx: sliceStart + numMatch[0].length
        };
    }
    return { token: null, nextIdx: i };
}