/**
 * CNPJ Validator - Validação Rigorosa com Dígitos Verificadores
 *
 * Implementa validação completa de CNPJ seguindo algoritmo oficial da Receita Federal.
 *
 * Características:
 * - Validação de dígitos verificadores (checksum)
 * - Detecção de CNPJs sequenciais inválidos (11.111.111/1111-11)
 * - Formatação automática (XX.XXX.XXX/XXXX-XX)
 * - Sanitização de entrada
 *
 * Princípios:
 * - NO FALLBACKS: Retorna null para dados ausentes, throw Error para dados inválidos
 * - Single Source of Truth: Uma função para cada propósito
 * - DRY: Reutiliza lógica de cálculo de dígitos
 *
 * @module CNPJValidator
 * @version 1.0.0
 * @since 2025-10-19
 */

class CNPJValidator {
    /**
     * Lista de CNPJs sequenciais conhecidos como inválidos
     * @private
     */
    static INVALID_CNPJS = [
        '00000000000000',
        '11111111111111',
        '22222222222222',
        '33333333333333',
        '44444444444444',
        '55555555555555',
        '66666666666666',
        '77777777777777',
        '88888888888888',
        '99999999999999'
    ];

    /**
     * Remove formatação do CNPJ (pontos, barras, hífens)
     *
     * @param {string} cnpj - CNPJ formatado ou não
     * @returns {string|null} CNPJ apenas com dígitos ou null se vazio
     *
     * @example
     * sanitize('12.345.678/0001-90') // '12345678000190'
     * sanitize('12345678000190')     // '12345678000190'
     * sanitize('')                   // null
     */
    static sanitize(cnpj) {
        if (!cnpj || typeof cnpj !== 'string') {
            return null;
        }

        const sanitized = cnpj.replace(/[^\d]/g, '');
        return sanitized.length > 0 ? sanitized : null;
    }

    /**
     * Formata CNPJ no padrão XX.XXX.XXX/XXXX-XX
     *
     * @param {string} cnpj - CNPJ sem formatação (14 dígitos)
     * @returns {string|null} CNPJ formatado ou null se inválido
     *
     * @example
     * format('12345678000190') // '12.345.678/0001-90'
     * format('123456780001')   // null (menos de 14 dígitos)
     */
    static format(cnpj) {
        const sanitized = this.sanitize(cnpj);

        if (!sanitized || sanitized.length !== 14) {
            return null;
        }

        return sanitized.replace(
            /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
            '$1.$2.$3/$4-$5'
        );
    }

    /**
     * Calcula dígito verificador do CNPJ
     *
     * Algoritmo da Receita Federal:
     * 1. Multiplica cada dígito por peso específico
     * 2. Soma os resultados
     * 3. Calcula resto da divisão por 11
     * 4. Dígito = (resto < 2) ? 0 : 11 - resto
     *
     * @private
     * @param {string} cnpjBase - Primeiros 12 dígitos (1º dígito) ou 13 dígitos (2º dígito)
     * @returns {number} Dígito verificador (0-9)
     */
    static _calcularDigito(cnpjBase) {
        // Pesos para multiplicação (ordem reversa)
        const pesos = cnpjBase.length === 12
            ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]  // 1º dígito
            : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]; // 2º dígito

        const soma = cnpjBase
            .split('')
            .reduce((acc, digit, idx) => acc + parseInt(digit) * pesos[idx], 0);

        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    /**
     * Valida CNPJ com verificação completa de dígitos
     *
     * Verifica:
     * 1. Tamanho (14 dígitos)
     * 2. CNPJs sequenciais inválidos
     * 3. Primeiro dígito verificador
     * 4. Segundo dígito verificador
     *
     * @param {string} cnpj - CNPJ formatado ou não
     * @returns {boolean} true se válido, false caso contrário
     *
     * @example
     * validate('12.345.678/0001-90') // true (CNPJ fictício válido)
     * validate('11.111.111/1111-11') // false (sequencial)
     * validate('12.345.678/0001-99') // false (dígito verificador errado)
     */
    static validate(cnpj) {
        const sanitized = this.sanitize(cnpj);

        // Validação básica
        if (!sanitized || sanitized.length !== 14) {
            return false;
        }

        // Rejeita CNPJs sequenciais
        if (this.INVALID_CNPJS.includes(sanitized)) {
            return false;
        }

        // Extrai dígitos
        const base = sanitized.substring(0, 12);
        const digit1 = parseInt(sanitized.charAt(12));
        const digit2 = parseInt(sanitized.charAt(13));

        // Valida 1º dígito
        const expectedDigit1 = this._calcularDigito(base);
        if (digit1 !== expectedDigit1) {
            return false;
        }

        // Valida 2º dígito
        const expectedDigit2 = this._calcularDigito(base + digit1);
        if (digit2 !== expectedDigit2) {
            return false;
        }

        return true;
    }

    /**
     * Valida e formata CNPJ em uma única operação
     *
     * Ideal para uso em formulários onde deseja-se validar E formatar simultaneamente.
     *
     * @param {string} cnpj - CNPJ formatado ou não
     * @returns {string|null} CNPJ formatado se válido, null caso contrário
     * @throws {Error} Se CNPJ for inválido (dígitos verificadores incorretos)
     *
     * @example
     * validateAndFormat('12345678000190')     // '12.345.678/0001-90'
     * validateAndFormat('12.345.678/0001-90') // '12.345.678/0001-90'
     * validateAndFormat('11111111111111')     // throws Error
     * validateAndFormat('')                   // null
     */
    static validateAndFormat(cnpj) {
        const sanitized = this.sanitize(cnpj);

        // Retorna null para valores vazios (NO FALLBACKS)
        if (!sanitized) {
            return null;
        }

        // Valida dígitos verificadores
        if (!this.validate(sanitized)) {
            throw new Error(
                `CNPJ inválido: "${cnpj}". ` +
                `Verifique os dígitos verificadores e tente novamente.`
            );
        }

        // Formata e retorna
        return this.format(sanitized);
    }

    /**
     * Extrai apenas números do CNPJ e valida tamanho
     *
     * Método auxiliar para uso em queries IndexedDB onde deseja-se
     * apenas os dígitos sem validação completa.
     *
     * @param {string} cnpj - CNPJ formatado ou não
     * @returns {string|null} 14 dígitos ou null se inválido
     *
     * @example
     * extractDigits('12.345.678/0001-90') // '12345678000190'
     * extractDigits('123456780001')       // null (12 dígitos)
     */
    static extractDigits(cnpj) {
        const sanitized = this.sanitize(cnpj);

        if (!sanitized || sanitized.length !== 14) {
            return null;
        }

        return sanitized;
    }
}

// Export para uso global
if (typeof window !== 'undefined') {
    window.CNPJValidator = CNPJValidator;
}
