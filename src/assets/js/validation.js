/* =====================================
   VALIDATION.JS
   Validações unificadas entre CEI e ProGoiás
   NO FALLBACKS - NO MOCK DATA
   ===================================== */

class FormValidator {
    constructor(config) {
        if (!config) {
            throw new Error('FormValidator: configuração obrigatória não fornecida');
        }
        
        if (!config.programType) {
            throw new Error('FormValidator: tipo de programa (programType) é obrigatório');
        }
        
        this.config = config;
        this.validationRules = this.loadValidationRules();
    }
    
    loadValidationRules() {
        const rules = {
            required: (value) => {
                if (!value || !value.toString().trim()) {
                    throw new Error('Este campo é obrigatório');
                }
                return true;
            },
            
            email: (value) => {
                if (!value) return true;
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    throw new Error('E-mail inválido');
                }
                return true;
            },
            
            cnpj: (value) => {
                if (!value) return true;
                const digits = value.replace(/\D/g, '');
                
                if (digits.length !== 14) {
                    throw new Error('CNPJ deve ter 14 dígitos');
                }
                
                if (/^(\d)\1{13}$/.test(digits)) {
                    throw new Error('CNPJ inválido');
                }
                
                if (!this.validateCNPJCheckDigits(digits)) {
                    throw new Error('CNPJ inválido');
                }
                
                return true;
            },
            
            cpf: (value) => {
                if (!value) return true;
                const digits = value.replace(/\D/g, '');
                
                if (digits.length !== 11) {
                    throw new Error('CPF deve ter 11 dígitos');
                }
                
                if (/^(\d)\1{10}$/.test(digits)) {
                    throw new Error('CPF inválido');
                }
                
                if (!this.validateCPFCheckDigits(digits)) {
                    throw new Error('CPF inválido');
                }
                
                return true;
            },
            
            phone: (value) => {
                if (!value) return true;
                const digits = value.replace(/\D/g, '');
                
                if (digits.length < 10 || digits.length > 11) {
                    throw new Error('Telefone deve ter 10 ou 11 dígitos');
                }
                
                if (!/^[1-9]{2}9?[0-9]{8}$/.test(digits)) {
                    throw new Error('Telefone inválido');
                }
                
                return true;
            },
            
            cep: (value) => {
                if (!value) return true;
                const digits = value.replace(/\D/g, '');
                
                if (digits.length !== 8) {
                    throw new Error('CEP deve ter 8 dígitos');
                }
                
                return true;
            },
            
            currency: (value) => {
                if (!value) return true;
                const cleanValue = value.replace(/[^\d.,]/g, '');
                const number = parseFloat(cleanValue.replace(',', '.'));
                
                if (isNaN(number)) {
                    throw new Error('Valor monetário inválido');
                }
                
                if (number < 0) {
                    throw new Error('Valor não pode ser negativo');
                }
                
                return true;
            },
            
            percentage: (value) => {
                if (!value) return true;
                const number = parseFloat(value);
                
                if (isNaN(number)) {
                    throw new Error('Percentual inválido');
                }
                
                if (number < 0 || number > 100) {
                    throw new Error('Percentual deve estar entre 0 e 100');
                }
                
                return true;
            },
            
            date: (value) => {
                if (!value) return true;
                const date = new Date(value);
                
                if (isNaN(date.getTime())) {
                    throw new Error('Data inválida');
                }
                
                return true;
            },
            
            minLength: (value, minLength) => {
                if (!value) return true;
                if (value.length < minLength) {
                    throw new Error(`Mínimo de ${minLength} caracteres`);
                }
                return true;
            },
            
            maxLength: (value, maxLength) => {
                if (!value) return true;
                if (value.length > maxLength) {
                    throw new Error(`Máximo de ${maxLength} caracteres`);
                }
                return true;
            },
            
            min: (value, min) => {
                if (!value) return true;
                const number = parseFloat(value);
                if (isNaN(number)) {
                    throw new Error('Valor numérico inválido');
                }
                if (number < min) {
                    throw new Error(`Valor mínimo: ${min}`);
                }
                return true;
            },
            
            max: (value, max) => {
                if (!value) return true;
                const number = parseFloat(value);
                if (isNaN(number)) {
                    throw new Error('Valor numérico inválido');
                }
                if (number > max) {
                    throw new Error(`Valor máximo: ${max}`);
                }
                return true;
            }
        };
        
        return rules;
    }
    
    validateField(field) {
        if (!field) {
            throw new Error('Campo não fornecido para validação');
        }
        
        if (!field.name) {
            throw new Error('Campo sem atributo name');
        }
        
        const value = field.value;
        const validations = this.getFieldValidations(field);
        
        for (const validation of validations) {
            try {
                this.applyValidation(validation, value);
            } catch (error) {
                return {
                    isValid: false,
                    error: error.message
                };
            }
        }
        
        return {
            isValid: true,
            error: null
        };
    }
    
    getFieldValidations(field) {
        const validations = [];
        
        // Required
        if (field.hasAttribute('required')) {
            validations.push({ type: 'required' });
        }
        
        // Type-based validations
        switch (field.type) {
            case 'email':
                validations.push({ type: 'email' });
                break;
            case 'tel':
                validations.push({ type: 'phone' });
                break;
            case 'date':
                validations.push({ type: 'date' });
                break;
        }
        
        // Data attributes
        if (field.dataset.validation) {
            const validationType = field.dataset.validation;
            if (this.validationRules[validationType]) {
                validations.push({ type: validationType });
            }
        }
        
        // HTML5 attributes
        if (field.minLength) {
            validations.push({ type: 'minLength', param: field.minLength });
        }
        
        if (field.maxLength) {
            validations.push({ type: 'maxLength', param: field.maxLength });
        }
        
        if (field.min) {
            validations.push({ type: 'min', param: parseFloat(field.min) });
        }
        
        if (field.max) {
            validations.push({ type: 'max', param: parseFloat(field.max) });
        }
        
        // Custom validations por programa
        const customValidations = this.getCustomValidations(field);
        validations.push(...customValidations);
        
        return validations;
    }
    
    getCustomValidations(field) {
        const customValidations = [];
        
        // Validações específicas para CEI
        if (this.config.programType === 'CEI') {
            if (field.name === 'investimentoMinimo') {
                customValidations.push({ 
                    type: 'custom', 
                    validator: (value) => {
                        const number = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
                        if (number < 500000) {
                            throw new Error('Investimento mínimo para CEI: R$ 500.000,00');
                        }
                        return true;
                    }
                });
            }
            
            if (field.name === 'prazoExecucao') {
                customValidations.push({
                    type: 'custom',
                    validator: (value) => {
                        const months = parseInt(value);
                        if (months > 36) {
                            throw new Error('Prazo máximo para CEI: 36 meses');
                        }
                        return true;
                    }
                });
            }
        }
        
        // Validações específicas para ProGoiás
        if (this.config.programType === 'ProGoiás') {
            if (field.name === 'empregosMinimos') {
                customValidations.push({
                    type: 'custom',
                    validator: (value) => {
                        const number = parseInt(value);
                        if (number < 10) {
                            throw new Error('ProGoiás requer mínimo de 10 empregos diretos');
                        }
                        return true;
                    }
                });
            }
        }
        
        return customValidations;
    }
    
    applyValidation(validation, value) {
        if (validation.type === 'custom') {
            return validation.validator(value);
        }
        
        const rule = this.validationRules[validation.type];
        if (!rule) {
            throw new Error(`Regra de validação '${validation.type}' não encontrada`);
        }
        
        if (validation.param !== undefined) {
            return rule(value, validation.param);
        }
        
        return rule(value);
    }
    
    validateSection(sectionElement) {
        if (!sectionElement) {
            throw new Error('Seção não fornecida para validação');
        }
        
        const fields = sectionElement.querySelectorAll('.form-control');
        const errors = new Map();
        let isValid = true;
        
        fields.forEach(field => {
            const result = this.validateField(field);
            if (!result.isValid) {
                errors.set(field.name, result.error);
                isValid = false;
            }
        });
        
        return {
            isValid,
            errors
        };
    }
    
    validateCNPJCheckDigits(cnpj) {
        const digits = cnpj.split('').map(Number);
        
        // Primeiro dígito verificador
        let sum = 0;
        let weight = 5;
        
        for (let i = 0; i < 12; i++) {
            sum += digits[i] * weight;
            weight = weight === 2 ? 9 : weight - 1;
        }
        
        let checkDigit = sum % 11;
        checkDigit = checkDigit < 2 ? 0 : 11 - checkDigit;
        
        if (digits[12] !== checkDigit) {
            return false;
        }
        
        // Segundo dígito verificador
        sum = 0;
        weight = 6;
        
        for (let i = 0; i < 13; i++) {
            sum += digits[i] * weight;
            weight = weight === 2 ? 9 : weight - 1;
        }
        
        checkDigit = sum % 11;
        checkDigit = checkDigit < 2 ? 0 : 11 - checkDigit;
        
        return digits[13] === checkDigit;
    }
    
    validateCPFCheckDigits(cpf) {
        const digits = cpf.split('').map(Number);
        
        // Primeiro dígito verificador
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += digits[i] * (10 - i);
        }
        
        let checkDigit = sum % 11;
        checkDigit = checkDigit < 2 ? 0 : 11 - checkDigit;
        
        if (digits[9] !== checkDigit) {
            return false;
        }
        
        // Segundo dígito verificador
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += digits[i] * (11 - i);
        }
        
        checkDigit = sum % 11;
        checkDigit = checkDigit < 2 ? 0 : 11 - checkDigit;
        
        return digits[10] === checkDigit;
    }
    
    // Validações específicas de negócio
    validateInvestmentPeriod(startDate, endDate, maxMonths) {
        if (!startDate || !endDate) {
            throw new Error('Datas de início e fim são obrigatórias');
        }
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        
        if (start >= end) {
            throw new Error('Data de início deve ser anterior à data de fim');
        }
        
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        
        if (diffMonths > maxMonths) {
            throw new Error(`Período máximo permitido: ${maxMonths} meses`);
        }
        
        return true;
    }
    
    validateInvestmentMinimum(totalInvestment, operationValue, minimumPercentage) {
        if (!totalInvestment || !operationValue) {
            throw new Error('Valores de investimento e operação são obrigatórios');
        }
        
        const investment = parseFloat(totalInvestment.replace(/[^\d.,]/g, '').replace(',', '.'));
        const operation = parseFloat(operationValue.replace(/[^\d.,]/g, '').replace(',', '.'));
        
        if (isNaN(investment) || isNaN(operation)) {
            throw new Error('Valores de investimento inválidos');
        }
        
        const percentage = (investment / operation) * 100;
        
        if (percentage < minimumPercentage) {
            throw new Error(`Investimento deve ser no mínimo ${minimumPercentage}% do valor da operação`);
        }
        
        return true;
    }
    
    validateFileUpload(file, maxSizeMB, allowedExtensions) {
        if (!file) {
            throw new Error('Arquivo não fornecido');
        }
        
        if (!allowedExtensions.includes(file.type)) {
            throw new Error(`Tipo de arquivo não permitido. Permitidos: ${allowedExtensions.join(', ')}`);
        }
        
        const maxSizeBytes = maxSizeMB * 1024 * 1024;
        if (file.size > maxSizeBytes) {
            throw new Error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB`);
        }
        
        return true;
    }
}

// Formatadores de campo (sem fallbacks)
class FieldFormatter {
    static formatCNPJ(value) {
        const digits = value.replace(/\D/g, '');
        if (digits.length !== 14) {
            throw new Error('CNPJ deve ter 14 dígitos para formatação');
        }
        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }
    
    static formatCPF(value) {
        const digits = value.replace(/\D/g, '');
        if (digits.length !== 11) {
            throw new Error('CPF deve ter 11 dígitos para formatação');
        }
        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    
    static formatPhone(value) {
        const digits = value.replace(/\D/g, '');
        if (digits.length === 11) {
            return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (digits.length === 10) {
            return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        } else {
            throw new Error('Telefone deve ter 10 ou 11 dígitos para formatação');
        }
    }
    
    static formatCEP(value) {
        const digits = value.replace(/\D/g, '');
        if (digits.length !== 8) {
            throw new Error('CEP deve ter 8 dígitos para formatação');
        }
        return digits.replace(/(\d{5})(\d{3})/, '$1-$2');
    }
    
    static formatCurrency(value) {
        const number = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'));
        if (isNaN(number)) {
            throw new Error('Valor monetário inválido para formatação');
        }
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number);
    }
    
    static formatPercentage(value) {
        const number = parseFloat(value);
        if (isNaN(number)) {
            throw new Error('Percentual inválido para formatação');
        }
        return `${number.toFixed(2)}%`;
    }
}

// Auto-formatação de campos
class FieldAutoFormatter {
    constructor() {
        this.setupFormatters();
    }
    
    setupFormatters() {
        document.addEventListener('input', (e) => {
            const field = e.target;
            
            if (field.dataset.format) {
                this.applyFormat(field, field.dataset.format);
            }
        });
    }
    
    applyFormat(field, formatType) {
        const value = field.value;
        if (!value) return;
        
        try {
            switch (formatType) {
                case 'cnpj':
                    field.value = FieldFormatter.formatCNPJ(value);
                    break;
                case 'cpf':
                    field.value = FieldFormatter.formatCPF(value);
                    break;
                case 'phone':
                    field.value = FieldFormatter.formatPhone(value);
                    break;
                case 'cep':
                    field.value = FieldFormatter.formatCEP(value);
                    break;
                case 'currency':
                    field.value = FieldFormatter.formatCurrency(value);
                    break;
            }
        } catch (error) {
            // Não formatar se inválido - NO FALLBACK
            console.log(`Formatação ${formatType} falhou:`, error.message);
        }
    }
}

// Validadores específicos de campo (sem instância)
class FieldValidator {
    /**
     * Valida se soma de participações societárias = 100%
     * NO FALLBACKS - Valores inválidos geram erro explícito
     * @param {Array<number>} participacoes - Array de percentuais
     * @returns {Object} { isValid, total, message }
     * @throws {Error} Se array vazio ou valores inválidos
     */
    static validateCapitalTotal(participacoes) {
        if (!Array.isArray(participacoes)) {
            throw new Error('participacoes deve ser um array');
        }

        if (participacoes.length === 0) {
            throw new Error('Nenhum sócio cadastrado');
        }

        // Validar cada participação - NO FALLBACKS
        for (let i = 0; i < participacoes.length; i++) {
            const p = participacoes[i];

            if (p === null || p === undefined || p === '') {
                throw new Error(`Participação do sócio ${i + 1} não informada`);
            }

            const parsed = parseFloat(p);
            if (isNaN(parsed)) {
                throw new Error(`Participação do sócio ${i + 1} inválida: "${p}"`);
            }

            if (parsed < 0) {
                throw new Error(`Participação do sócio ${i + 1} não pode ser negativa`);
            }

            if (parsed > 100) {
                throw new Error(`Participação do sócio ${i + 1} não pode ser maior que 100%`);
            }
        }

        // Calcular total (apenas valores já validados)
        const total = participacoes.reduce((sum, p) => sum + parseFloat(p), 0);
        const rounded = Math.round(total * 100) / 100; // 2 decimais

        if (rounded === 100.0) {
            return {
                isValid: true,
                total: rounded,
                message: '✓ Total correto'
            };
        } else if (rounded < 100.0) {
            const falta = (100 - rounded).toFixed(2);
            return {
                isValid: false,
                total: rounded,
                message: `⚠️ Faltam ${falta}%`
            };
        } else {
            const excede = (rounded - 100).toFixed(2);
            return {
                isValid: false,
                total: rounded,
                message: `❌ Excede em ${excede}%`
            };
        }
    }

    /**
     * Valida unicidade de CPF/CNPJ entre sócios
     * NO FALLBACKS - Documentos vazios ou inválidos geram erro
     * @param {Array<string>} documentos - Array de CPF/CNPJ
     * @returns {Object} { isValid, duplicates }
     * @throws {Error} Se array vazio ou documentos inválidos
     */
    static validateUniqueDocuments(documentos) {
        if (!Array.isArray(documentos)) {
            throw new Error('documentos deve ser um array');
        }

        if (documentos.length === 0) {
            throw new Error('Nenhum documento fornecido');
        }

        // Validar cada documento - NO FALLBACKS
        for (let i = 0; i < documentos.length; i++) {
            const doc = documentos[i];

            if (!doc || doc.trim() === '') {
                throw new Error(`Documento do sócio ${i + 1} não informado`);
            }
        }

        const cleanedDocs = documentos.map(doc => doc.replace(/\D/g, ''));
        const seen = new Set();
        const duplicates = [];

        cleanedDocs.forEach((doc, idx) => {
            if (seen.has(doc)) {
                duplicates.push({ index: idx + 1, documento: documentos[idx] });
            }
            seen.add(doc);
        });

        return {
            isValid: duplicates.length === 0,
            duplicates
        };
    }
}

// Exportar classes para window (navegador)
if (typeof window !== 'undefined') {
    window.FormValidator = FormValidator;
    window.FieldFormatter = FieldFormatter;
    window.FieldAutoFormatter = FieldAutoFormatter;
    window.FieldValidator = FieldValidator;
}

// Exportar para Node.js (se necessário para testes)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        FormValidator,
        FieldFormatter,
        FieldAutoFormatter,
        FieldValidator
    };
}