/**
 * validation-engine.js
 * Motor centralizado de validação
 *
 * NO FALLBACKS - All rules must pass
 * SOLID: Single Responsibility (apenas validação)
 * DRY: Regras externas em JSON, não duplicadas
 *
 * @version 1.0.0
 * @date 2025-01-25
 */

/**
 * Erro customizado para validação
 */
export class ValidationError extends Error {
    constructor(message, errors) {
        super(message);
        this.name = 'ValidationError';
        this.errors = errors;
    }
}

/**
 * Motor de validação centralizado
 */
export class ValidationEngine {
    #rules = null;
    #rulesPath = '../assets/js/config/validation-rules.json';

    constructor(rulesPath) {
        if (rulesPath) {
            this.#rulesPath = rulesPath;
        }

        console.log('🔍 [ValidationEngine] Inicializado');
    }

    // ====================================================================
    // Rules Loading (NO HARDCODED DATA)
    // ====================================================================

    /**
     * Carrega regras de validação do arquivo JSON
     * @private
     * @returns {Promise<Object>}
     */
    async #loadRules() {
        if (this.#rules) {
            return this.#rules;
        }

        try {
            const response = await fetch(this.#rulesPath);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            this.#rules = await response.json();
            console.log('📥 [ValidationEngine] Regras carregadas de:', this.#rulesPath);

            return this.#rules;

        } catch (error) {
            const message = `Falha ao carregar regras de validação: ${error.message}`;
            console.error(`❌ [ValidationEngine] ${message}`);

            // NO FALLBACK - lança exceção
            throw new Error(message);
        }
    }

    // ====================================================================
    // Validation Methods
    // ====================================================================

    /**
     * Valida dados contra schema específico
     * @param {Object} data - Dados a validar
     * @param {string} schema - Nome do schema ('balanco', 'dre', 'full')
     * @returns {Promise<ValidationResult>}
     */
    async validate(data, schema = 'full') {
        const rules = await this.#loadRules();
        const schemaRules = rules.schemas[schema];

        if (!schemaRules) {
            throw new Error(`Schema '${schema}' não encontrado em validation-rules.json`);
        }

        console.log(`🔍 [ValidationEngine] Validando com schema '${schema}'...`);

        const errors = [];
        const warnings = [];

        // Validar campos obrigatórios
        for (const rule of schemaRules.required) {
            const result = this.#validateRequiredField(data, rule);

            if (!result.valid) {
                errors.push(result.error);
            }
        }

        // Validar regras de negócio
        if (schemaRules.businessRules) {
            for (const rule of schemaRules.businessRules) {
                const result = this.#validateBusinessRule(data, rule);

                if (!result.valid) {
                    if (rule.severity === 'warning') {
                        warnings.push(result.error);
                    } else {
                        errors.push(result.error);
                    }
                }
            }
        }

        const isValid = errors.length === 0;

        if (isValid) {
            console.log(`✅ [ValidationEngine] Validação passou (${warnings.length} warnings)`);
        } else {
            console.error(`❌ [ValidationEngine] Validação falhou: ${errors.length} erros`);
        }

        return {
            isValid,
            errors,
            warnings,
            schema
        };
    }

    /**
     * Valida campo obrigatório
     * @private
     */
    #validateRequiredField(data, rule) {
        const value = this.#getNestedValue(data, rule.path);

        // Verifica existência
        if (value === undefined || value === null || value === '') {
            return {
                valid: false,
                error: {
                    field: rule.path,
                    message: rule.message,
                    severity: 'error',
                    type: 'required'
                }
            };
        }

        // Valida tipo se especificado
        if (rule.type) {
            const typeValid = this.#validateType(value, rule.type);

            if (!typeValid) {
                return {
                    valid: false,
                    error: {
                        field: rule.path,
                        message: `Campo '${rule.path}' deve ser do tipo ${rule.type}`,
                        severity: 'error',
                        type: 'type-mismatch'
                    }
                };
            }
        }

        // Valida mínimo se especificado
        if (rule.min !== null && rule.min !== undefined) {
            if (value < rule.min) {
                return {
                    valid: false,
                    error: {
                        field: rule.path,
                        message: `Campo '${rule.path}' deve ser >= ${rule.min} (atual: ${value})`,
                        severity: 'error',
                        type: 'min-value'
                    }
                };
            }
        }

        return { valid: true };
    }

    /**
     * Valida regra de negócio (expressão JavaScript)
     * @private
     */
    #validateBusinessRule(data, rule) {
        try {
            // Avalia expressão JavaScript
            const isValid = new Function('data', `return ${rule.expression}`)(data);

            if (!isValid) {
                return {
                    valid: false,
                    error: {
                        field: rule.field,
                        message: rule.message,
                        severity: rule.severity || 'error',
                        type: 'business-rule',
                        ruleId: rule.id
                    }
                };
            }

            return { valid: true };

        } catch (error) {
            // Erro ao avaliar expressão
            console.error(`[ValidationEngine] Erro ao avaliar regra '${rule.id}':`, error);

            return {
                valid: false,
                error: {
                    field: rule.field,
                    message: `Erro ao validar regra '${rule.id}': ${error.message}`,
                    severity: 'error',
                    type: 'evaluation-error'
                }
            };
        }
    }

    // ====================================================================
    // Helper Methods
    // ====================================================================

    /**
     * Obtém valor aninhado de objeto usando notação de ponto
     * @private
     * @param {Object} obj
     * @param {string} path - Ex: 'balanco.ativoTotal'
     * @returns {any}
     */
    #getNestedValue(obj, path) {
        return path.split('.').reduce((acc, part) => acc?.[part], obj);
    }

    /**
     * Valida tipo de valor
     * @private
     */
    #validateType(value, expectedType) {
        switch (expectedType) {
            case 'number':
                return typeof value === 'number' && !isNaN(value);
            case 'string':
                return typeof value === 'string';
            case 'boolean':
                return typeof value === 'boolean';
            case 'array':
                return Array.isArray(value);
            case 'object':
                return typeof value === 'object' && value !== null && !Array.isArray(value);
            default:
                return true;
        }
    }

    /**
     * Formata erros para exibição
     * @param {Array} errors
     * @returns {string}
     */
    formatErrors(errors) {
        return errors.map(err => `• ${err.field}: ${err.message}`).join('\n');
    }

    /**
     * Cria modal de erro de validação
     * @param {Array} errors
     * @returns {HTMLElement}
     */
    createErrorModal(errors) {
        const modal = document.createElement('div');
        modal.className = 'validation-error-modal';

        const errorList = errors.map(err => `
            <div class="validation-error-item">
                <strong>${err.field}</strong>
                <p>${err.message}</p>
                ${err.ruleId ? `<small>Regra: ${err.ruleId}</small>` : ''}
            </div>
        `).join('');

        modal.innerHTML = `
            <div class="modal-overlay">
                <div class="modal-content">
                    <h3>⚠️ Dados Incompletos ou Inválidos</h3>
                    <p>Os seguintes campos precisam ser corrigidos antes de calcular:</p>
                    <div class="validation-errors">
                        ${errorList}
                    </div>
                    <button class="btn btn-primary" onclick="this.closest('.validation-error-modal').remove()">
                        Entendi
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    // ====================================================================
    // Debug Methods
    // ====================================================================

    /**
     * Retorna regras carregadas (debug)
     * @returns {Object|null}
     */
    getRules() {
        return this.#rules;
    }

    /**
     * Lista schemas disponíveis
     * @returns {Promise<string[]>}
     */
    async listSchemas() {
        const rules = await this.#loadRules();
        return Object.keys(rules.schemas);
    }

    /**
     * Loga informações de debug
     */
    async debug() {
        const schemas = await this.listSchemas();

        console.group('🔍 ValidationEngine - Debug');
        console.log('Rules Path:', this.#rulesPath);
        console.log('Rules Loaded:', this.#rules !== null);
        console.log('Available Schemas:', schemas);
        console.groupEnd();
    }
}

// ====================================================================
// Export Singleton
// ====================================================================

export const validationEngine = new ValidationEngine();

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.ValidationEngine = ValidationEngine;
    window.ValidationError = ValidationError;
    window.validationEngine = validationEngine;
}
