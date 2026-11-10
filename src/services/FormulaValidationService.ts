import { EditorMode, FormulaToken, Operator, TranslationFunction } from "../types/EquationEditor";
import { BasicSyntaxValidator } from "./BasicSyntaxValidator";
import { OperatorValidator } from "./OperatorValidator";

export class FormulaValidationService {
    private basicSyntaxValidator: BasicSyntaxValidator;
    private operatorValidator: OperatorValidator;

    constructor(
        minVariables: number = 1,
        translator?: TranslationFunction,
        translationPrefix?: string,
        mode: EditorMode = 'formula',
        operators: Operator[] = [],
        maxComparisonOperatorsInEquation: number = 1
    ) {
        const operatorsByValue = new Map(operators.map(operator => [operator.value, operator]));

        this.basicSyntaxValidator = new BasicSyntaxValidator(minVariables, translator, translationPrefix);
        this.operatorValidator = new OperatorValidator(
            mode,
            operatorsByValue,
            maxComparisonOperatorsInEquation,
            translator,
            translationPrefix
        );
    }

    public validateTokens(tokens: FormulaToken[], parserErrors: string[] = []): string[] {
        const errors: string[] = [...parserErrors];

        if (errors.length > 0) {
            // If there are parser errors, skip semantic checks
            return errors;
        }

        [
            this.basicSyntaxValidator.checkParentheses(tokens),
            this.basicSyntaxValidator.checkUnknownTokens(tokens),
            this.basicSyntaxValidator.checkStartOperator(tokens),
            this.basicSyntaxValidator.checkConsecutiveVarsOrNums(tokens),
            this.basicSyntaxValidator.checkConsecutiveOperators(tokens),
            this.operatorValidator.checkOperatorPlacement(tokens),
            this.operatorValidator.checkMinComparisonOperators(tokens),
            this.operatorValidator.checkComparisonSections(tokens),
            this.basicSyntaxValidator.checkMinVariables(tokens),
            this.basicSyntaxValidator.checkTrailingOperator(tokens)
        ].forEach(error => {
            if (error) errors.push(error);
        });

        return errors;
    }
}