/* =====================================
   DOCUMENT-VALIDATOR.JS
   Validação de documentos brasileiros com check digits
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Validação de documentos brasileiros (CNPJ, CPF) com algoritmo de check digits
 * Métodos estáticos, stateless, sem lógica de negócio
 */
export class DocumentValidator {
    /**
     * Valida CNPJ com check digits
     * @param {string} cnpj - CNPJ com ou sem formatação
     * @returns {boolean} True se CNPJ válido
     */
    static validateCNPJ(cnpj) {
        const digits = cnpj.replace(/\D/g, '');

        // Deve ter 14 dígitos
        if (digits.length !== 14) {
            return false;
        }

        // Não pode ser sequência de dígitos iguais
        if (/^(\d)\1{13}$/.test(digits)) {
            return false;
        }

        // Valida check digits
        return this.#validateCNPJCheckDigits(digits);
    }

    /**
     * Valida CPF com check digits
     * @param {string} cpf - CPF com ou sem formatação
     * @returns {boolean} True se CPF válido
     */
    static validateCPF(cpf) {
        const digits = cpf.replace(/\D/g, '');

        // Deve ter 11 dígitos
        if (digits.length !== 11) {
            return false;
        }

        // Não pode ser sequência de dígitos iguais
        if (/^(\d)\1{10}$/.test(digits)) {
            return false;
        }

        // Valida check digits
        return this.#validateCPFCheckDigits(digits);
    }

    /**
     * Valida check digits do CNPJ
     * @private
     * @param {string} cnpj - CNPJ apenas números (14 dígitos)
     * @returns {boolean} True se check digits corretos
     */
    static #validateCNPJCheckDigits(cnpj) {
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

    /**
     * Valida check digits do CPF
     * @private
     * @param {string} cpf - CPF apenas números (11 dígitos)
     * @returns {boolean} True se check digits corretos
     */
    static #validateCPFCheckDigits(cpf) {
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
}
