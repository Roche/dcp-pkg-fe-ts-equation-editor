import { BehaviorSubject, Observable, from, of, switchMap } from 'rxjs';
import { map } from 'rxjs/operators';
import { Variable, FormulaDetails, FormulaToken, AllOptions, EquationEditorConfig, EquationEditorUpdateOptions, Operator, OperatorVisualizationGroups } from './types/EquationEditor';
import { joinTokensNormalized } from './utilities/joinTokensNormalized';
import { MathOperator, Parenthesis } from './enums/MathSymbols';
import { getBuiltInOperatorsForMode, isMathOperatorValue } from './enums/OperatorDefinitions';
import { FormulaValidationService } from './services/FormulaValidationService';
import { OptionFilterService } from './services/OptionFilterService';
import { parseFormulaString } from './utilities/parseFormulaString';
import { TokenType } from './enums/TokenType';

const BUILT_IN_OPERATOR_TRANSLATION_KEYS: Record<string, string> = {
    '=': 'equals',
    '!=': 'notEquals',
    '>': 'greaterThan',
    '<': 'lessThan',
    '>=': 'greaterThanOrEqual',
    '<=': 'lessThanOrEqual',
    in: 'in',
    notIn: 'notIn',
    between: 'between',
    notBetween: 'notBetween',
    isNull: 'isNull',
    isNotNull: 'isNotNull',
    empty: 'empty',
    notEmpty: 'notEmpty',
    contains: 'contains',
    doesNotContain: 'doesNotContain',
    startsWith: 'startsWith',
    doesNotStartWith: 'doesNotStartWith',
    endsWith: 'endsWith',
    doesNotEndWith: 'doesNotEndWith',
    matches: 'matches',
    isTrue: 'isTrue',
    isFalse: 'isFalse'
};

const NON_TRANSLATABLE_SYMBOLIC_OPERATORS = new Set(['=', '!=', '>', '<', '>=', '<=']);
const LIST_RANGE_OPERATORS = new Set(['in', 'notIn', 'between', 'notBetween']);

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export class EquationEditor {
    private config: EquationEditorConfig;
    private tokens$ = new BehaviorSubject<FormulaToken[]>([]);
    private parserErrors: string[] = [];
    private variables: Variable[] = [];
    private functions: string[] = [];
    private operators: Operator[] = [];
    private validationService: FormulaValidationService;
    private optionOperatorsCache: Operator[] | null = null;
    private currentFormulaInput = '';

    constructor(
        initialFormula?: string,
        variables?: Variable[],
        functions?: string[],
        operators?: Operator[],
        config?: EquationEditorConfig
    ) {
        this.variables = variables ?? [];
        this.functions = functions ?? [];
        this.operators = operators ?? [];
        this.config = {
            mode: 'formula',
            minVariables: 1,
            variableFenceOpen: '{',
            variableFenceClose: '}',
            failOnUnknown: false,
            ...(config || {})
        };

        this.validationService = this.createValidationService();

        if (initialFormula) this.updateFormula(initialFormula);
    }

    // Main observable for tokens
    public getTokens$(): Observable<FormulaToken[]> {
        return this.tokens$.asObservable();
    }

    // Derived observable: formula string
    public formula$ = this.tokens$.pipe(
        map(tokens => joinTokensNormalized(
            tokens,
            this.config.variableFenceOpen,
            this.config.variableFenceClose,
            this.config.numberFenceOpen ?? null,
            this.config.numberFenceClose ?? null
        ))
    );

    // Derived observable: validity
    public valid$ = this.tokens$.pipe(
        switchMap(tokens => {
            const localErrors = this.validationService.validateTokens(tokens, this.parserErrors);
            if (this.config.customValidator) {
                const formula = joinTokensNormalized(
                    tokens,
                    this.config.variableFenceOpen,
                    this.config.variableFenceClose,
                    this.config.numberFenceOpen ?? null,
                    this.config.numberFenceClose ?? null
                );
                const result = this.config.customValidator(formula, tokens);
                return from(Promise.resolve(result)).pipe(
                    map(customErrors => {
                        if (this.config.ignoreInternalErrors) {
                            return customErrors || [];
                        }
                        return [
                            ...localErrors,
                            ...(customErrors || [])
                        ];
                    })
                );
            }
            return of(localErrors);
        })
    );

    // Derived observable: formula details
    public formulaDetails$ = this.tokens$.pipe(
        map(tokens => this.getFormulaDetailsFromTokens(tokens))
    );

    // Grouped options
    public groupedOptions$: Observable<AllOptions> = this.tokens$.pipe(
        map(tokens => {
            const options = this.getNextOptionsFromTokens(tokens);
            return {
                ...options,
                operatorGroups: this.groupOperatorsForVisualization(options.operators)
            };
        })
    );

    public groupedOperatorOptions$: Observable<OperatorVisualizationGroups> = this.formula$.pipe(
        map(() => this.getGroupedOperatorsForCurrentState())
    );

    public setVariables(variables: Variable[]): void {
        this.variables = variables;
        this.refreshCurrentState();
    }

    public setFunctions(functions: string[]): void {
        this.functions = functions;
        this.refreshCurrentState();
    }

    public setOperators(operators: Operator[]): void {
        this.operators = operators;
        this.refreshCurrentState();
    }

    public updateConfig(partial: Partial<EquationEditorConfig>): void {
        const nextConfig = {
            ...this.config,
            ...partial
        };
        const shouldSerializeWithNextConfig = this.shouldSerializeTokensForConfigUpdate(partial);

        this.config = nextConfig;
        this.refreshCurrentState(shouldSerializeWithNextConfig);
    }

    public updateOptions(payload: EquationEditorUpdateOptions): void {
        if (payload.variables) {
            this.variables = payload.variables;
        }

        if (payload.functions) {
            this.functions = payload.functions;
        }

        if (payload.operators) {
            this.operators = payload.operators;
        }

        if (payload.config) {
            this.config = {
                ...this.config,
                ...payload.config
            };
        }

        this.refreshCurrentState(!!payload.config && this.shouldSerializeTokensForConfigUpdate(payload.config));
    }

    public updateFormula(input: string): void {
        this.parseAndEmit(input);
    }

    public clear(): void {
        this.currentFormulaInput = '';
        this.parserErrors = [];
        this.tokens$.next([]);
    }

    public getConfig(): EquationEditorConfig {
        return { ...this.config };
    }

    public getVariables(): Variable[] {
        return this.variables;
    }

    public getFunctions(): string[] {
        return this.functions;
    }

    public getOperators(): Operator[] {
        return this.operators;
    }

    public static getFormulaDetails(
        formula: string,
        variables: Variable[],
        functions?: string[],
        operators?: Operator[],
        config?: EquationEditorConfig
    ): FormulaDetails {
        const editor = new EquationEditor(
            formula,
            variables,
            functions,
            operators,
            config
        );
        
        const tokens = editor.getCurrentTokens();
        return editor.getFormulaDetailsFromTokens(tokens);
    }

    public getFormulaDetailsFor(formula: string, variables?: Variable[]): FormulaDetails {
        return EquationEditor.getFormulaDetails(
            formula,
            variables ?? this.variables,
            this.functions,
            this.operators,
            this.config
        );
    }

    public getFormulaDetailsFromTokens(tokens: FormulaToken[]): FormulaDetails {
        const display = joinTokensNormalized(
            tokens,
            this.config.variableFenceOpen,
            this.config.variableFenceClose,
            this.config.numberFenceOpen ?? null,
            this.config.numberFenceClose ?? null
        );

        let unfancedDisplay = display;
        let raw = display;
        let fanciedRaw = display;

        this.variables.forEach(variable => {
            const fencedLabel = `${this.config.variableFenceOpen}${variable.label}${this.config.variableFenceClose}`;
            const unfencedLabel = variable.label;
            const unfencedValue = variable.value;
            const fencedValue = `${this.config.variableFenceOpen}${variable.value}${this.config.variableFenceClose}`;

            // unfancedDisplay: replace {label} with label
            unfancedDisplay = unfancedDisplay.replace(
                new RegExp(escapeRegExp(fencedLabel), 'g'),
                unfencedLabel
            );

            // raw: replace {label} with value
            raw = raw.replace(
                new RegExp(escapeRegExp(fencedLabel), 'g'),
                unfencedValue
            );

            // fanciedRaw: replace {label} with {value}
            fanciedRaw = fanciedRaw.replace(
                new RegExp(escapeRegExp(fencedLabel), 'g'),
                fencedValue
            );
        });

        return { raw, fanciedRaw, display, unfancedDisplay, tokens };
    }

    public getNextOptions(): AllOptions {
        const operators = this.getOptionOperatorsForMode();
        const tokens = this.tokens$.getValue();
        const options = OptionFilterService.getRelevantOptions(tokens, {
            variables: this.variables,
            operators,
            brackets: ['['],
            argumentSeparators: [','],
            parentheses: [
                Parenthesis.Open,
                Parenthesis.Close
            ],
            functions: this.functions
        }, this.config.mode);

        return this.applyEquationOptionGuards(tokens, options);
    }

    public getNextOptionsFromTokens(tokens: FormulaToken[]): AllOptions {
        const operators = this.getOptionOperatorsForMode();
        const options = OptionFilterService.getRelevantOptions(tokens, {
            variables: this.variables,
            operators,
            brackets: ['['],
            argumentSeparators: [','],
            parentheses: [
                Parenthesis.Open,
                Parenthesis.Close
            ],
            functions: this.functions
        }, this.config.mode);

        return this.applyEquationOptionGuards(tokens, options);
    }

    private applyEquationOptionGuards(tokens: FormulaToken[], options: AllOptions): AllOptions {
        const filteredOperators = this.filterOperatorsByComparisonLimit(tokens, options.operators);
        if (this.shouldSuppressAllOptionsAfterClosedRange(tokens)) {
            return {
                variables: [],
                operators: [],
                brackets: [],
                argumentSeparators: [],
                parentheses: [],
                functions: [],
                operatorGroups: {
                    math: [],
                    logical: []
                }
            };
        }

        return {
            ...options,
            operators: filteredOperators,
            operatorGroups: this.groupOperatorsForVisualization(filteredOperators)
        };
    }

    private shouldSuppressAllOptionsAfterClosedRange(tokens: FormulaToken[]): boolean {
        if ((this.config.mode || 'formula') !== 'equation') {
            return false;
        }

        if (!this.hasReachedComparisonLimit(tokens)) {
            return false;
        }

        const last = tokens[tokens.length - 1];
        if (!last || last.type !== TokenType.RightBracket) {
            return false;
        }

        let bracketDepth = 0;
        let matchingLeftBracketIndex = -1;

        for (let i = tokens.length - 1; i >= 0; i--) {
            if (tokens[i].type === TokenType.RightBracket) {
                bracketDepth++;
                continue;
            }

            if (tokens[i].type === TokenType.LeftBracket) {
                bracketDepth--;
                if (bracketDepth === 0) {
                    matchingLeftBracketIndex = i;
                    break;
                }
            }
        }

        if (matchingLeftBracketIndex <= 0) {
            return false;
        }

        const operatorBeforeBracket = tokens[matchingLeftBracketIndex - 1];
        return !!operatorBeforeBracket && LIST_RANGE_OPERATORS.has(operatorBeforeBracket.value);
    }

    private hasReachedComparisonLimit(tokens: FormulaToken[]): boolean {
        const maxComparisonOperators = this.config.maxComparisonOperatorsInEquation ?? 1;
        if (maxComparisonOperators < 1) {
            return false;
        }

        return this.getComparisonOperatorCount(tokens) >= maxComparisonOperators;
    }

    private getComparisonOperatorCount(tokens: FormulaToken[]): number {
        const operatorsByValue = new Map(this.getOptionOperatorsForMode().map(operator => [operator.value, operator]));

        return tokens.reduce((count, token) => {
            if (token.type !== TokenType.Operator && token.type !== TokenType.MathSymbol) {
                return count;
            }

            const resolved = operatorsByValue.get(token.value);
            if (!resolved) {
                return count;
            }

            const fixity = resolved.fixity || 'infix';
            const category = resolved.category;
            const isComparable = category === 'comparison' || category === 'text';
            return isComparable && fixity === 'infix' ? count + 1 : count;
        }, 0);
    }

    private filterOperatorsByComparisonLimit(tokens: FormulaToken[], operators: (MathOperator | string | Operator)[]): (MathOperator | string | Operator)[] {
        if ((this.config.mode || 'formula') !== 'equation') {
            return operators;
        }

        if (!this.hasReachedComparisonLimit(tokens)) {
            return operators;
        }

        return operators.filter(operator => {
            const normalized = this.normalizeOperator(operator);
            return normalized.category === 'math' || isMathOperatorValue(normalized.value);
        });
    }

    public getCurrentTokens(): FormulaToken[] {
        return this.tokens$.getValue();
    }

    public getGroupedOperatorsForCurrentState(): OperatorVisualizationGroups {
        return this.getGroupedOperatorsFromTokens(this.tokens$.getValue());
    }

    public getGroupedOperatorsFromTokens(tokens: FormulaToken[]): OperatorVisualizationGroups {
        const options = this.getNextOptionsFromTokens(tokens);
        return this.groupOperatorsForVisualization(options.operators);
    }

    private getBuiltInOperatorsForCurrentMode(): Operator[] {
        return getBuiltInOperatorsForMode(this.config.mode || 'formula');
    }

    private createValidationService(): FormulaValidationService {
        return new FormulaValidationService(
            this.config.minVariables,
            this.config.translator,
            this.config.translationPrefix,
            this.config.mode,
            [
                ...this.getBuiltInOperatorsForCurrentMode(),
                ...this.getUserOperatorsForMode()
            ],
            this.config.maxComparisonOperatorsInEquation ?? 1
        );
    }

    private getBuiltInNonMathOperatorsForMode(): Operator[] {
        return this.getBuiltInOperatorsForCurrentMode().filter(operator => !isMathOperatorValue(operator.value));
    }

    private getUserOperatorsForMode(): Operator[] {
        const mode = this.config.mode || 'formula';

        return this.operators.filter(operator => {
            if (!operator.modes || operator.modes.length === 0) {
                return true;
            }

            return operator.modes.includes(mode);
        });
    }

    private getOptionOperatorsForMode(): Operator[] {
        if (this.optionOperatorsCache) {
            return this.optionOperatorsCache;
        }

        const builtInOperators = this.getBuiltInOperatorsForCurrentMode();
        const operators = [
            ...builtInOperators,
            ...this.getUserOperatorsForMode()
        ];

        const translatedOperators = operators.map(operator => this.translateOperatorLabel(operator));
        this.optionOperatorsCache = translatedOperators;
        return translatedOperators;
    }

    private refreshCurrentState(serializeWithCurrentConfig: boolean = false): void {
        this.invalidateDerivedState();

        const hasFormula = this.currentFormulaInput.length > 0 || this.tokens$.getValue().length > 0;
        if (!hasFormula) {
            this.tokens$.next([]);
            return;
        }

        const nextFormula = this.getFormulaInputForRefresh(serializeWithCurrentConfig);
        this.parseAndEmit(nextFormula);
    }

    private invalidateDerivedState(): void {
        this.optionOperatorsCache = null;
        this.validationService = this.createValidationService();
    }

    private getFormulaInputForRefresh(serializeWithCurrentConfig: boolean): string {
        if (serializeWithCurrentConfig || !this.currentFormulaInput) {
            return joinTokensNormalized(
                this.tokens$.getValue(),
                this.config.variableFenceOpen,
                this.config.variableFenceClose,
                this.config.numberFenceOpen ?? null,
                this.config.numberFenceClose ?? null
            );
        }

        return this.currentFormulaInput;
    }

    private shouldSerializeTokensForConfigUpdate(partial: Partial<EquationEditorConfig>): boolean {
        return partial.variableFenceOpen !== undefined ||
            partial.variableFenceClose !== undefined ||
            partial.numberFenceOpen !== undefined ||
            partial.numberFenceClose !== undefined;
    }

    private parseAndEmit(input: string): void {
        this.currentFormulaInput = input;
        this.invalidateDerivedState();

        const parserOperators = [
            ...this.getBuiltInNonMathOperatorsForMode(),
            ...this.getUserOperatorsForMode()
        ];

        const parseResult = parseFormulaString(
            input,
            this.variables.map(v => v.label),
            this.functions,
            parserOperators,
            {
                failOnUnknown: this.config.failOnUnknown,
                variableFenceOpen: this.config.variableFenceOpen,
                variableFenceClose: this.config.variableFenceClose,
                numberFenceOpen: this.config.numberFenceOpen,
                numberFenceClose: this.config.numberFenceClose
            }
        );

        this.parserErrors = parseResult.errors || [];
        const decoratedTokens = this.decorateTokenLabels(parseResult.tokens);
        const enrichedTokens = this.enrichTokensWithMetadata(decoratedTokens);
        this.tokens$.next(enrichedTokens);
    }

    private decorateTokenLabels(tokens: FormulaToken[]): FormulaToken[] {
        const translatedOperatorLabels = new Map(
            this.getOptionOperatorsForMode().map(operator => [operator.value, operator.label])
        );

        return tokens.map(token => {
            if (token.type !== TokenType.Operator && token.type !== TokenType.MathSymbol) {
                return token;
            }

            const label = translatedOperatorLabels.get(token.value);
            if (!label || label === token.value) {
                return token;
            }

            return {
                ...token,
                label
            };
        });
    }

    private enrichTokensWithMetadata(tokens: FormulaToken[]): FormulaToken[] {
        const variableMap = new Map(
            this.variables.map(v => [v.label, v])
        );

        const operatorMap = new Map(
            this.getOptionOperatorsForMode().map(op => [op.value, op])
        );

        return tokens.map(token => {
            const data = variableMap.get(token.value)?.data || operatorMap.get(token.value)?.data;
            
            return data ? { ...token, data: { ...data } } : token;
        });
    }

    private translateOperatorLabel(operator: Operator): Operator {
        if (!this.config.translator || !this.config.translationPrefix) {
            return operator;
        }

        if (operator.category === 'math' || NON_TRANSLATABLE_SYMBOLIC_OPERATORS.has(operator.value)) {
            return operator;
        }

        const operatorKey = BUILT_IN_OPERATOR_TRANSLATION_KEYS[operator.value] || operator.value;
        const key = `${this.config.translationPrefix}.filter.operator.${operatorKey}`;
        const translated = this.config.translator(key, {
            value: operator.value,
            key: operatorKey,
            label: operator.label,
            category: operator.category
        });

        if (!translated || translated === key) {
            return operator;
        }

        return {
            ...operator,
            label: translated
        };
    }

    private groupOperatorsForVisualization(operators: (MathOperator | string | Operator)[]): OperatorVisualizationGroups {
        const normalized = operators.map(operator => this.normalizeOperator(operator));

        return {
            math: normalized.filter(operator => operator.category === 'math' || isMathOperatorValue(operator.value)),
            logical: normalized.filter(operator => !(operator.category === 'math' || isMathOperatorValue(operator.value)))
        };
    }

    private normalizeOperator(operator: MathOperator | string | Operator): Operator {
        if (typeof operator === 'object') {
            return operator;
        }

        if (isMathOperatorValue(operator)) {
            return {
                label: operator,
                value: operator,
                category: 'math',
                arity: 'binary',
                fixity: 'infix',
                valueKind: 'single'
            };
        }

        return {
            label: operator,
            value: operator,
            category: 'comparison',
            arity: 'binary',
            fixity: 'infix',
            valueKind: 'single'
        };
    }
}