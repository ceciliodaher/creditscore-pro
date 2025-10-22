/* =====================================
   FORM-GENERATOR.JS
   Geração dinâmica de formulários HTML baseado em configuração
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

import { DocumentValidator } from '@shared/validators/document-validator';
import { CurrencyFormatter } from '@shared/formatters/currency-formatter';

/**
 * Gerador de formulários HTML dinâmico configurável
 * Cria formulários completos baseado em configuração JSON
 * Integra com validadores, formatadores e masks existentes
 */
export class FormGenerator {
    /**
     * @param {Object} config - Configuração completa do sistema (creditscore-config.json)
     * @param {Object} messages - Mensagens do sistema (messages.json)
     * @throws {Error} Se config ou messages ausentes
     */
    constructor(config, messages) {
        if (!config) {
            throw new Error('FormGenerator: configuração obrigatória não fornecida');
        }

        if (!messages) {
            throw new Error('FormGenerator: messages obrigatório não fornecido');
        }

        // Validar estrutura mínima da config
        if (!config.modules || !Array.isArray(config.modules)) {
            throw new Error('FormGenerator: config.modules deve ser um array');
        }

        if (!config.validationRules) {
            throw new Error('FormGenerator: config.validationRules obrigatória');
        }

        this.config = config;
        this.messages = messages;
        this.validators = new Map();
        this.eventListeners = new Map();

        console.log('✅ FormGenerator instanciado');
    }

    /**
     * Inicialização assíncrona (carregamento de dependências externas)
     * @returns {Promise<boolean>}
     */
    async init() {
        try {
            // Verificar disponibilidade de utilitários necessários
            if (typeof window !== 'undefined') {
                // CurrencyMask deve estar disponível globalmente
                if (!window.currencyMask) {
                    console.warn('⚠️ CurrencyMask não disponível - máscaras monetárias desabilitadas');
                }
            }

            console.log('✅ FormGenerator inicializado');
            return true;
        } catch (error) {
            throw new Error(`FormGenerator: Erro na inicialização - ${error.message}`);
        }
    }

    /**
     * Gera HTML completo de um módulo
     * @param {number|string} moduleId - ID do módulo
     * @returns {string} HTML do módulo
     * @throws {Error} Se módulo não existir
     */
    generateModuleHTML(moduleId) {
        const module = this.config.modules.find(m => m.id === Number(moduleId));

        if (!module) {
            throw new Error(`FormGenerator: Módulo ${moduleId} não encontrado na configuração`);
        }

        // Módulos computed não precisam de formulário de entrada
        if (module.computed) {
            return this.#generateComputedModuleHTML(module);
        }

        return this.#generateInputModuleHTML(module);
    }

    /**
     * Gera HTML para módulos computed (readonly/display only)
     * @private
     */
    #generateComputedModuleHTML(module) {
        const moduleKey = this.#getModuleMessageKey(module.name);
        const messages = this.messages.modules[moduleKey];

        if (!messages) {
            throw new Error(`FormGenerator: messages.modules.${moduleKey} não encontrado - obrigatório`);
        }

        if (!this.messages.icons?.loading) {
            throw new Error('FormGenerator: messages.icons.loading não encontrado - obrigatório');
        }

        if (!messages.loading) {
            throw new Error(`FormGenerator: messages.modules.${moduleKey}.loading não encontrado - obrigatório`);
        }

        return `
            <div class="module-container computed-module" data-module="${module.name}">
                <div class="module-header">
                    <h2>
                        <span class="module-icon">${module.icon}</span>
                        ${module.title}
                    </h2>
                    <p class="module-description">${module.description}</p>
                </div>

                <div class="computed-content">
                    <div class="loading-state">
                        <span class="loading-icon">${this.messages.icons.loading}</span>
                        <p>${messages.loading}</p>
                    </div>

                    <div class="computed-results" id="${module.name}-results" style="display: none;">
                        <!-- Results will be injected here by calculator modules -->
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Gera HTML para módulos de input (cadastro, demonstrações, etc)
     * @private
     */
    #generateInputModuleHTML(module) {
        const moduleKey = this.#getModuleMessageKey(module.name);
        const messages = this.messages.modules[moduleKey];

        if (!messages) {
            throw new Error(`FormGenerator: messages.modules.${moduleKey} não encontrado - obrigatório`);
        }

        if (!this.messages.icons?.save) {
            throw new Error('FormGenerator: messages.icons.save não encontrado - obrigatório');
        }

        if (!this.messages.buttons?.save) {
            throw new Error('FormGenerator: messages.buttons.save não encontrado - obrigatório');
        }

        if (module.required && !this.messages.icons?.warning) {
            throw new Error('FormGenerator: messages.icons.warning não encontrado - obrigatório para módulos required');
        }

        const fields = this.#getModuleFields(module);

        return `
            <div class="module-container input-module" data-module="${module.name}">
                <div class="module-header">
                    <h2>
                        <span class="module-icon">${module.icon}</span>
                        ${module.title}
                    </h2>
                    <p class="module-description">${module.description}</p>
                </div>

                <form class="module-form" data-module-form="${module.name}">
                    ${fields.map(field => this.generateFormField(field)).join('\n')}

                    <div class="form-actions">
                        <button type="button" class="btn btn-secondary" data-action="save-draft">
                            ${this.messages.icons.save} ${this.messages.buttons.save}
                        </button>

                        ${module.required ? `
                            <span class="required-indicator">
                                ${this.messages.icons.warning} Módulo obrigatório
                            </span>
                        ` : ''}
                    </div>
                </form>
            </div>
        `;
    }

    /**
     * Gera HTML de um campo individual do formulário
     * @param {Object} fieldConfig - Configuração do campo
     * @returns {string} HTML do campo
     * @throws {Error} Se fieldConfig inválido
     */
    generateFormField(fieldConfig) {
        if (!fieldConfig || typeof fieldConfig !== 'object') {
            throw new Error('FormGenerator: fieldConfig deve ser um objeto');
        }

        if (!fieldConfig.type) {
            throw new Error('FormGenerator: fieldConfig.type é obrigatório');
        }

        if (!fieldConfig.name) {
            throw new Error('FormGenerator: fieldConfig.name é obrigatório');
        }

        const fieldGenerator = this.#getFieldGenerator(fieldConfig.type);

        if (!fieldGenerator) {
            throw new Error(`FormGenerator: Tipo de campo não suportado: ${fieldConfig.type}`);
        }

        return fieldGenerator.call(this, fieldConfig);
    }

    /**
     * Retorna função geradora para tipo de campo específico
     * @private
     */
    #getFieldGenerator(type) {
        const generators = {
            'text': this.#generateTextField,
            'email': this.#generateEmailField,
            'cnpj': this.#generateCNPJField,
            'cpf': this.#generateCPFField,
            'currency': this.#generateCurrencyField,
            'percentage': this.#generatePercentageField,
            'date': this.#generateDateField,
            'select': this.#generateSelectField,
            'textarea': this.#generateTextareaField,
            'table': this.#generateTableField,
            'number': this.#generateNumberField,
            'checkbox': this.#generateCheckboxField,
            'radio': this.#generateRadioField
        };

        return generators[type];
    }

    /**
     * Gera campo de texto simples
     * @private
     */
    #generateTextField(fieldConfig) {
        return this.#generateBaseInputField(fieldConfig, 'text');
    }

    /**
     * Gera campo de email
     * @private
     */
    #generateEmailField(fieldConfig) {
        if (!this.config.validationRules.email) {
            throw new Error('FormGenerator: config.validationRules.email não encontrado - obrigatório');
        }

        const validation = this.config.validationRules.email;

        return this.#generateBaseInputField({
            ...fieldConfig,
            pattern: validation.pattern,
            inputType: 'email'
        }, 'email');
    }

    /**
     * Gera campo de CNPJ
     * @private
     */
    #generateCNPJField(fieldConfig) {
        if (!this.config.validationRules.cnpj) {
            throw new Error('FormGenerator: config.validationRules.cnpj não encontrado - obrigatório');
        }

        const validation = this.config.validationRules.cnpj;

        // Placeholder é obrigatório para campos CNPJ
        if (!fieldConfig.placeholder) {
            throw new Error('FormGenerator: fieldConfig.placeholder obrigatório para campos CNPJ');
        }

        return this.#generateBaseInputField({
            ...fieldConfig,
            pattern: validation.pattern,
            maxlength: 18, // XX.XXX.XXX/XXXX-XX
            placeholder: fieldConfig.placeholder,
            dataValidation: 'cnpj'
        }, 'text');
    }

    /**
     * Gera campo de CPF
     * @private
     */
    #generateCPFField(fieldConfig) {
        // Placeholder é obrigatório para campos CPF
        if (!fieldConfig.placeholder) {
            throw new Error('FormGenerator: fieldConfig.placeholder obrigatório para campos CPF');
        }

        return this.#generateBaseInputField({
            ...fieldConfig,
            maxlength: 14, // XXX.XXX.XXX-XX
            placeholder: fieldConfig.placeholder,
            dataValidation: 'cpf'
        }, 'text');
    }

    /**
     * Gera campo de valor monetário
     * @private
     */
    #generateCurrencyField(fieldConfig) {
        // Placeholder é obrigatório para campos currency
        if (!fieldConfig.placeholder) {
            throw new Error('FormGenerator: fieldConfig.placeholder obrigatório para campos currency');
        }

        return this.#generateBaseInputField({
            ...fieldConfig,
            dataMask: 'currency',
            placeholder: fieldConfig.placeholder
        }, 'text');
    }

    /**
     * Gera campo de percentual
     * @private
     */
    #generatePercentageField(fieldConfig) {
        if (!this.config.validationRules.percentuais) {
            throw new Error('FormGenerator: config.validationRules.percentuais não encontrado - obrigatório');
        }

        const validation = this.config.validationRules.percentuais;

        // Placeholder é obrigatório para campos percentage
        if (!fieldConfig.placeholder) {
            throw new Error('FormGenerator: fieldConfig.placeholder obrigatório para campos percentage');
        }

        return this.#generateBaseInputField({
            ...fieldConfig,
            inputType: 'number',
            min: validation.min,
            max: validation.max,
            step: 0.01,
            placeholder: fieldConfig.placeholder
        }, 'number');
    }

    /**
     * Gera campo de data
     * @private
     */
    #generateDateField(fieldConfig) {
        return this.#generateBaseInputField(fieldConfig, 'date');
    }

    /**
     * Gera campo numérico genérico
     * @private
     */
    #generateNumberField(fieldConfig) {
        // Step é obrigatório para campos number
        if (fieldConfig.step === undefined) {
            throw new Error('FormGenerator: fieldConfig.step obrigatório para campos number');
        }

        return this.#generateBaseInputField({
            ...fieldConfig,
            inputType: 'number',
            step: fieldConfig.step
        }, 'number');
    }

    /**
     * Gera campo base de input (text, email, number, date, etc)
     * @private
     */
    #generateBaseInputField(fieldConfig, type) {
        const {
            name,
            label,
            placeholder = '',
            required = false,
            disabled = false,
            readonly = false,
            min,
            max,
            maxlength,
            pattern,
            dataValidation,
            dataMask,
            helpText,
            defaultValue = '',
            inputType
        } = fieldConfig;

        // inputType em fieldConfig sobrescreve o type passado como parâmetro
        const actualType = inputType !== undefined ? inputType : type;

        if (!actualType) {
            throw new Error('FormGenerator: tipo de input obrigatório (inputType ou type)');
        }

        const fieldId = `field-${name}`;
        const requiredAttr = required ? 'required' : '';
        const disabledAttr = disabled ? 'disabled' : '';
        const readonlyAttr = readonly ? 'readonly' : '';
        const minAttr = min !== undefined ? `min="${min}"` : '';
        const maxAttr = max !== undefined ? `max="${max}"` : '';
        const maxlengthAttr = maxlength ? `maxlength="${maxlength}"` : '';
        const patternAttr = pattern ? `pattern="${pattern}"` : '';
        const dataValidationAttr = dataValidation ? `data-validation="${dataValidation}"` : '';
        const dataMaskAttr = dataMask ? `data-mask="${dataMask}"` : '';

        return `
            <div class="form-group">
                ${label ? `
                    <label for="${fieldId}" class="form-label">
                        ${label}
                        ${required ? '<span class="required-asterisk">*</span>' : ''}
                    </label>
                ` : ''}

                <input
                    type="${actualType}"
                    id="${fieldId}"
                    name="${name}"
                    class="form-control"
                    placeholder="${placeholder}"
                    value="${defaultValue}"
                    ${requiredAttr}
                    ${disabledAttr}
                    ${readonlyAttr}
                    ${minAttr}
                    ${maxAttr}
                    ${maxlengthAttr}
                    ${patternAttr}
                    ${dataValidationAttr}
                    ${dataMaskAttr}
                />

                ${helpText ? `<small class="form-help">${helpText}</small>` : ''}
            </div>
        `;
    }

    /**
     * Gera campo select (dropdown)
     * @private
     */
    #generateSelectField(fieldConfig) {
        const {
            name,
            label,
            required = false,
            disabled = false,
            options = [],
            defaultValue = '',
            helpText
        } = fieldConfig;

        if (!Array.isArray(options)) {
            throw new Error(`FormGenerator: campo select "${name}" deve ter array de options`);
        }

        const fieldId = `field-${name}`;
        const requiredAttr = required ? 'required' : '';
        const disabledAttr = disabled ? 'disabled' : '';

        return `
            <div class="form-group">
                ${label ? `
                    <label for="${fieldId}" class="form-label">
                        ${label}
                        ${required ? '<span class="required-asterisk">*</span>' : ''}
                    </label>
                ` : ''}

                <select
                    id="${fieldId}"
                    name="${name}"
                    class="form-control"
                    ${requiredAttr}
                    ${disabledAttr}
                >
                    <option value="">Selecione...</option>
                    ${options.map(opt => {
                        const value = typeof opt === 'object' ? opt.value : opt;
                        const text = typeof opt === 'object' ? opt.label : opt;
                        const selected = value === defaultValue ? 'selected' : '';
                        return `<option value="${value}" ${selected}>${text}</option>`;
                    }).join('\n')}
                </select>

                ${helpText ? `<small class="form-help">${helpText}</small>` : ''}
            </div>
        `;
    }

    /**
     * Gera campo textarea (texto longo)
     * @private
     */
    #generateTextareaField(fieldConfig) {
        const {
            name,
            label,
            placeholder = '',
            required = false,
            disabled = false,
            readonly = false,
            rows = 4,
            maxlength,
            helpText,
            defaultValue = ''
        } = fieldConfig;

        const fieldId = `field-${name}`;
        const requiredAttr = required ? 'required' : '';
        const disabledAttr = disabled ? 'disabled' : '';
        const readonlyAttr = readonly ? 'readonly' : '';
        const maxlengthAttr = maxlength ? `maxlength="${maxlength}"` : '';

        return `
            <div class="form-group">
                ${label ? `
                    <label for="${fieldId}" class="form-label">
                        ${label}
                        ${required ? '<span class="required-asterisk">*</span>' : ''}
                    </label>
                ` : ''}

                <textarea
                    id="${fieldId}"
                    name="${name}"
                    class="form-control"
                    placeholder="${placeholder}"
                    rows="${rows}"
                    ${requiredAttr}
                    ${disabledAttr}
                    ${readonlyAttr}
                    ${maxlengthAttr}
                >${defaultValue}</textarea>

                ${helpText ? `<small class="form-help">${helpText}</small>` : ''}
            </div>
        `;
    }

    /**
     * Gera campo de tabela (para demonstrativos financeiros)
     * @private
     */
    #generateTableField(fieldConfig) {
        const {
            name,
            label,
            columns = [],
            rows = [],
            helpText
        } = fieldConfig;

        if (!Array.isArray(columns) || columns.length === 0) {
            throw new Error(`FormGenerator: campo table "${name}" deve ter array de columns`);
        }

        const tableId = `table-${name}`;

        return `
            <div class="form-group table-group">
                ${label ? `<h3 class="table-label">${label}</h3>` : ''}

                <div class="table-responsive">
                    <table id="${tableId}" class="data-table" data-table="${name}">
                        <thead>
                            <tr>
                                ${columns.map(col => {
                                    // Label é obrigatório para cabeçalhos de tabela
                                    if (!col.label) {
                                        throw new Error(`FormGenerator: coluna "${col.name}" deve ter label definido`);
                                    }
                                    return `<th>${col.label}</th>`;
                                }).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${rows.map((row, rowIndex) => `
                                <tr data-row="${rowIndex}">
                                    ${columns.map(col => {
                                        // Validação explícita de valores de célula
                                        if (!row.hasOwnProperty(col.name)) {
                                            throw new Error(`FormGenerator: linha ${rowIndex} não possui campo obrigatório "${col.name}"`);
                                        }

                                        // Tipo de coluna obrigatório
                                        if (!col.type) {
                                            throw new Error(`FormGenerator: coluna "${col.name}" deve ter tipo definido`);
                                        }

                                        const cellValue = row[col.name];
                                        const cellType = col.type;
                                        const cellName = `${name}[${rowIndex}][${col.name}]`;

                                        return `
                                            <td>
                                                ${this.#generateTableCell(cellName, cellType, cellValue, col)}
                                            </td>
                                        `;
                                    }).join('')}
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                ${helpText ? `<small class="form-help">${helpText}</small>` : ''}
            </div>
        `;
    }

    /**
     * Gera célula de tabela
     * @private
     */
    #generateTableCell(name, type, value, config) {
        const { readonly = false, dataMask, placeholder = '' } = config;
        const readonlyAttr = readonly ? 'readonly' : '';
        const dataMaskAttr = dataMask ? `data-mask="${dataMask}"` : '';

        if (type === 'currency') {
            return `
                <input
                    type="text"
                    name="${name}"
                    class="table-input"
                    value="${value}"
                    data-mask="currency"
                    placeholder="${placeholder}"
                    ${readonlyAttr}
                />
            `;
        }

        if (type === 'number') {
            return `
                <input
                    type="number"
                    name="${name}"
                    class="table-input"
                    value="${value}"
                    placeholder="${placeholder}"
                    ${readonlyAttr}
                />
            `;
        }

        return `
            <input
                type="text"
                name="${name}"
                class="table-input"
                value="${value}"
                placeholder="${placeholder}"
                ${dataMaskAttr}
                ${readonlyAttr}
            />
        `;
    }

    /**
     * Injeta HTML gerado no container DOM
     * @param {string} containerId - ID do container
     * @param {string} html - HTML a injetar
     * @throws {Error} Se container não existir
     */
    injectIntoDOM(containerId, html) {
        if (!containerId) {
            throw new Error('FormGenerator: containerId obrigatório');
        }

        const container = document.getElementById(containerId);

        if (!container) {
            throw new Error(`FormGenerator: Container #${containerId} não encontrado no DOM`);
        }

        container.innerHTML = html;
        console.log(`✅ HTML injetado em #${containerId}`);
    }

    /**
     * Anexa event listeners aos campos de um módulo
     * @param {string|number} moduleId - ID do módulo
     */
    attachEventListeners(moduleId) {
        const module = this.config.modules.find(m => m.id === Number(moduleId));

        if (!module) {
            throw new Error(`FormGenerator: Módulo ${moduleId} não encontrado`);
        }

        const container = document.querySelector(`[data-module="${module.name}"]`);

        if (!container) {
            console.warn(`⚠️ Container do módulo ${module.name} não encontrado no DOM`);
            return;
        }

        // Anexar validação em tempo real
        const inputs = container.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', (e) => this.#validateFieldOnBlur(e.target));
        });

        // Anexar máscaras
        if (window.currencyMask) {
            const currencyFields = container.querySelectorAll('[data-mask="currency"]');
            currencyFields.forEach(field => {
                window.currencyMask.applyMask(field);
            });
        }

        console.log(`✅ Event listeners anexados ao módulo ${module.name}`);
    }

    /**
     * Valida campo ao perder foco
     * @private
     */
    #validateFieldOnBlur(field) {
        const validationType = field.getAttribute('data-validation');

        if (!validationType) {
            return true; // Sem validação especial
        }

        let isValid = true;
        let errorMessage = '';

        switch (validationType) {
            case 'cnpj':
                isValid = DocumentValidator.validateCNPJ(field.value);
                errorMessage = 'CNPJ inválido';
                break;

            case 'cpf':
                isValid = DocumentValidator.validateCPF(field.value);
                errorMessage = 'CPF inválido';
                break;

            default:
                console.warn(`⚠️ Tipo de validação desconhecido: ${validationType}`);
        }

        if (!isValid) {
            this.#showFieldError(field, errorMessage);
        } else {
            this.#clearFieldError(field);
        }

        return isValid;
    }

    /**
     * Mostra erro em campo
     * @private
     */
    #showFieldError(field, message) {
        field.classList.add('error');

        let errorElement = field.parentNode.querySelector('.error-message');
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'error-message';
            field.parentNode.appendChild(errorElement);
        }

        errorElement.textContent = message;
    }

    /**
     * Limpa erro de campo
     * @private
     */
    #clearFieldError(field) {
        field.classList.remove('error');
        const errorElement = field.parentNode.querySelector('.error-message');
        if (errorElement) {
            errorElement.remove();
        }
    }

    /**
     * Retorna chave de mensagem para módulo
     * @private
     * @throws {Error} Se moduleName não mapeado
     */
    #getModuleMessageKey(moduleName) {
        // Mapear nomes de módulo para chaves de mensagem
        const keyMap = {
            'cadastro': 'cadastro',
            'demonstracoes': 'demonstracoes',
            'endividamento': 'endividamento',
            'indices': 'indices',
            'scoring': 'scoring',
            'compliance': 'complianceModule',
            'recursos-humanos': 'recursosHumanos',
            'relatorios': 'relatorios'
        };

        if (!keyMap.hasOwnProperty(moduleName)) {
            throw new Error(`FormGenerator: módulo "${moduleName}" não possui mapeamento de mensagem definido`);
        }

        return keyMap[moduleName];
    }

    /**
     * Retorna configuração de campos para um módulo
     * @private
     */
    #getModuleFields(module) {
        // Por enquanto retorna array vazio
        // Em produção, isso viria de uma configuração de fields específica
        // ou de um schema externo
        return [];
    }

    /**
     * Gera campo checkbox
     * @private
     */
    #generateCheckboxField(fieldConfig) {
        const {
            name,
            label,
            required = false,
            disabled = false,
            defaultValue = false,
            helpText
        } = fieldConfig;

        const fieldId = `field-${name}`;
        const requiredAttr = required ? 'required' : '';
        const disabledAttr = disabled ? 'disabled' : '';
        const checkedAttr = defaultValue ? 'checked' : '';

        return `
            <div class="form-group form-check">
                <input
                    type="checkbox"
                    id="${fieldId}"
                    name="${name}"
                    class="form-check-input"
                    ${requiredAttr}
                    ${disabledAttr}
                    ${checkedAttr}
                />
                <label for="${fieldId}" class="form-check-label">
                    ${label}
                    ${required ? '<span class="required-asterisk">*</span>' : ''}
                </label>
                ${helpText ? `<small class="form-help">${helpText}</small>` : ''}
            </div>
        `;
    }

    /**
     * Gera campo radio
     * @private
     */
    #generateRadioField(fieldConfig) {
        const {
            name,
            label,
            required = false,
            disabled = false,
            options = [],
            defaultValue = '',
            helpText
        } = fieldConfig;

        if (!Array.isArray(options)) {
            throw new Error(`FormGenerator: campo radio "${name}" deve ter array de options`);
        }

        const requiredAttr = required ? 'required' : '';
        const disabledAttr = disabled ? 'disabled' : '';

        return `
            <div class="form-group">
                ${label ? `
                    <label class="form-label">
                        ${label}
                        ${required ? '<span class="required-asterisk">*</span>' : ''}
                    </label>
                ` : ''}

                ${options.map((opt, index) => {
                    const value = typeof opt === 'object' ? opt.value : opt;
                    const text = typeof opt === 'object' ? opt.label : opt;
                    const checked = value === defaultValue ? 'checked' : '';
                    const radioId = `field-${name}-${index}`;

                    return `
                        <div class="form-check">
                            <input
                                type="radio"
                                id="${radioId}"
                                name="${name}"
                                value="${value}"
                                class="form-check-input"
                                ${checked}
                                ${requiredAttr}
                                ${disabledAttr}
                            />
                            <label for="${radioId}" class="form-check-label">
                                ${text}
                            </label>
                        </div>
                    `;
                }).join('')}

                ${helpText ? `<small class="form-help">${helpText}</small>` : ''}
            </div>
        `;
    }

    /**
     * Aplica máscaras a campos após renderização no container
     * @param {HTMLElement|string} container - Container DOM ou seletor
     * @throws {Error} Se componentes de máscara obrigatórios não disponíveis
     */
    applyMasks(container) {
        const containerElement = typeof container === 'string'
            ? document.querySelector(container)
            : container;

        if (!containerElement) {
            throw new Error('FormGenerator: container não encontrado para aplicar máscaras');
        }

        // Currency Mask
        const currencyFields = containerElement.querySelectorAll('[data-mask="currency"]');
        if (currencyFields.length > 0) {
            if (!window.currencyMask) {
                throw new Error('FormGenerator: CurrencyMask não disponível - obrigatório para campos currency');
            }
            currencyFields.forEach(field => window.currencyMask.applyMask(field));
            console.log(`✅ Máscara currency aplicada a ${currencyFields.length} campos`);
        }

        // CNPJ Validator
        const cnpjFields = containerElement.querySelectorAll('[data-validation="cnpj"]');
        if (cnpjFields.length > 0) {
            if (!window.CNPJValidator) {
                throw new Error('FormGenerator: CNPJValidator não disponível - obrigatório para campos CNPJ');
            }
            cnpjFields.forEach(field => this.#applyCNPJMask(field));
            console.log(`✅ Validação CNPJ aplicada a ${cnpjFields.length} campos`);
        }

        // Percentage Calculator
        const percentageFields = containerElement.querySelectorAll('[data-validation="percentage"]');
        if (percentageFields.length > 0) {
            if (window.PercentageCalculator) {
                console.log(`✅ ${percentageFields.length} campos percentage identificados`);
            } else {
                console.log('⚠️ PercentageCalculator não disponível - cálculos desabilitados');
            }
        }

        console.log('🔧 Máscaras aplicadas ao container');
    }

    /**
     * Aplica máscara CNPJ com formatação ao digitar
     * @private
     */
    #applyCNPJMask(field) {
        field.addEventListener('input', (e) => {
            let value = e.target.value.replace(/\D/g, '');

            if (value.length <= 14) {
                if (value.length > 2) {
                    value = value.replace(/^(\d{2})(\d)/, '$1.$2');
                }
                if (value.length > 6) {
                    value = value.replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3');
                }
                if (value.length > 10) {
                    value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3/$4');
                }
                if (value.length > 15) {
                    value = value.replace(/^(\d{2})\.(\d{3})\.(\d{3})\/(\d{4})(\d)/, '$1.$2.$3/$4-$5');
                }
                e.target.value = value;
            }
        });

        field.addEventListener('blur', (e) => {
            const value = e.target.value;
            if (value) {
                try {
                    const formatted = window.CNPJValidator.validateAndFormat(value);
                    if (formatted) {
                        e.target.value = formatted;
                        this.#clearFieldError(e.target);
                    }
                } catch (error) {
                    this.#showFieldError(e.target, 'CNPJ inválido');
                }
            }
        });
    }

    /**
     * Configura data binding bidirecional entre campo e modelo
     * @param {HTMLElement} field - Campo de formulário
     * @param {string} dataPath - Caminho no modelo (ex: "cadastro.razaoSocial")
     */
    setupDataBinding(field, dataPath) {
        if (!field || !(field instanceof HTMLElement)) {
            throw new Error('FormGenerator: field deve ser um HTMLElement válido');
        }

        if (!dataPath || typeof dataPath !== 'string') {
            throw new Error('FormGenerator: dataPath deve ser uma string válida');
        }

        // View -> Model (atualização do modelo quando campo muda)
        field.addEventListener('input', (e) => {
            this.#updateModelPath(dataPath, e.target.value);
            this.#dispatchFieldEvent('fieldChanged', {
                field: dataPath,
                value: e.target.value,
                timestamp: Date.now()
            });
        });

        // Validação on blur
        field.addEventListener('blur', (e) => {
            const isValid = this.#validateFieldOnBlur(e.target);
            this.#dispatchFieldEvent('fieldValidated', {
                field: dataPath,
                isValid: isValid
            });
        });

        console.log(`✅ Data binding configurado: ${dataPath}`);
    }

    /**
     * Atualiza valor no modelo de dados seguindo o path
     * @private
     */
    #updateModelPath(path, value) {
        if (!this.modelData) {
            throw new Error('FormGenerator: modelData não inicializado - use setModelData() antes de atualizar');
        }

        const parts = path.split('.');
        let obj = this.modelData;

        for (let i = 0; i < parts.length - 1; i++) {
            if (!obj[parts[i]]) {
                obj[parts[i]] = {};
            }
            obj = obj[parts[i]];
        }

        obj[parts[parts.length - 1]] = value;
    }

    /**
     * Dispara evento customizado de campo
     * @private
     */
    #dispatchFieldEvent(eventName, detail) {
        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
    }

    /**
     * Valida módulo completo
     * @param {number|string} moduleId - ID do módulo
     * @returns {Object} { isValid, errors, warnings }
     */
    validateModule(moduleId) {
        const module = this.config.modules.find(m => m.id === Number(moduleId));

        if (!module) {
            throw new Error(`FormGenerator: Módulo ${moduleId} não encontrado`);
        }

        const form = document.querySelector(`[data-module-form="${module.name}"]`);

        if (!form) {
            throw new Error(`FormGenerator: Formulário do módulo ${module.name} não encontrado`);
        }

        const errors = [];
        const warnings = [];
        const fields = form.querySelectorAll('input, select, textarea');

        fields.forEach(field => {
            if (!this.#validateFieldOnBlur(field)) {
                const errorElement = field.parentNode.querySelector('.error-message');

                if (!errorElement || !errorElement.textContent) {
                    throw new Error(`FormGenerator: campo "${field.name}" inválido mas sem mensagem de erro definida`);
                }

                errors.push({
                    field: field.name,
                    message: errorElement.textContent
                });
            }
        });

        const isValid = errors.length === 0;

        this.#dispatchFieldEvent('formValidated', {
            moduleId: module.id,
            moduleName: module.name,
            isValid: isValid,
            errors: errors,
            warnings: warnings,
            timestamp: Date.now()
        });

        console.log(isValid ? `✅ Módulo ${module.name} validado` : `❌ Módulo ${module.name} com erros`, { errors });

        return { isValid, errors, warnings };
    }

    /**
     * Marca módulo como completo (após validação)
     * @param {number|string} moduleId - ID do módulo
     * @returns {boolean} true se completado com sucesso
     */
    markModuleComplete(moduleId) {
        const validation = this.validateModule(moduleId);

        if (validation.isValid) {
            const module = this.config.modules.find(m => m.id === Number(moduleId));

            this.#dispatchFieldEvent('moduleCompleted', {
                moduleId: module.id,
                moduleName: module.name,
                timestamp: Date.now()
            });

            console.log(`✅ Módulo ${module.name} marcado como completo`);
            return true;
        } else {
            console.log(`⚠️ Módulo não pode ser completado - há erros de validação`);
            return false;
        }
    }

    /**
     * Obtém dados do modelo
     * @returns {Object} Dados do modelo
     * @throws {Error} Se modelData não inicializado
     */
    getModelData() {
        if (!this.modelData) {
            throw new Error('FormGenerator: modelData não inicializado - use setModelData() primeiro');
        }

        return this.modelData;
    }

    /**
     * Define dados no modelo
     * @param {Object} data - Dados a definir
     */
    setModelData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('FormGenerator: data deve ser um objeto válido');
        }
        this.modelData = data;
        console.log('📊 Dados do modelo atualizados');
    }
}

// Expor globalmente
if (typeof window !== 'undefined') {
    window.FormGenerator = FormGenerator;
}

console.log('✅ FormGenerator carregado');
