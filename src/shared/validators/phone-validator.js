/* =====================================
   PHONE-VALIDATOR.JS
   Validação de telefones brasileiros
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Validação de telefones brasileiros (fixo e celular)
 * Métodos estáticos, stateless, sem lógica de negócio
 */
export class PhoneValidator {
    /**
     * Valida telefone brasileiro (fixo ou celular)
     * @param {string} phone - Telefone com ou sem formatação
     * @returns {boolean} True se telefone válido
     */
    static validate(phone) {
        const digits = phone.replace(/\D/g, '');

        // Deve ter 10 (fixo) ou 11 (celular) dígitos
        if (digits.length !== 10 && digits.length !== 11) {
            return false;
        }

        // Valida DDD (primeiros 2 dígitos)
        const ddd = parseInt(digits.substring(0, 2));
        if (!this.#isValidDDD(ddd)) {
            return false;
        }

        // Se for celular (11 dígitos), terceiro dígito deve ser 9
        if (digits.length === 11) {
            if (digits.charAt(2) !== '9') {
                return false;
            }
        }

        // Se for fixo (10 dígitos), terceiro dígito não pode ser 9
        if (digits.length === 10) {
            if (digits.charAt(2) === '9') {
                return false;
            }
        }

        // Não pode ser sequência de números iguais
        if (/^(\d)\1{9,10}$/.test(digits)) {
            return false;
        }

        return true;
    }

    /**
     * Valida se é telefone celular
     * @param {string} phone - Telefone com ou sem formatação
     * @returns {boolean} True se celular válido
     */
    static validateCelular(phone) {
        const digits = phone.replace(/\D/g, '');

        if (digits.length !== 11) {
            return false;
        }

        // Terceiro dígito deve ser 9
        if (digits.charAt(2) !== '9') {
            return false;
        }

        return this.validate(phone);
    }

    /**
     * Valida se é telefone fixo
     * @param {string} phone - Telefone com ou sem formatação
     * @returns {boolean} True se fixo válido
     */
    static validateFixo(phone) {
        const digits = phone.replace(/\D/g, '');

        if (digits.length !== 10) {
            return false;
        }

        // Terceiro dígito não pode ser 9
        if (digits.charAt(2) === '9') {
            return false;
        }

        return this.validate(phone);
    }

    /**
     * Valida DDD brasileiro
     * @private
     * @param {number} ddd - Código DDD (2 dígitos)
     * @returns {boolean} True se DDD válido
     */
    static #isValidDDD(ddd) {
        // Lista de DDDs válidos no Brasil
        const validDDDs = [
            11, 12, 13, 14, 15, 16, 17, 18, 19, // SP
            21, 22, 24, // RJ
            27, 28, // ES
            31, 32, 33, 34, 35, 37, 38, // MG
            41, 42, 43, 44, 45, 46, // PR
            47, 48, 49, // SC
            51, 53, 54, 55, // RS
            61, // DF
            62, 64, // GO
            63, // TO
            65, 66, // MT
            67, // MS
            68, // AC
            69, // RO
            71, 73, 74, 75, 77, // BA
            79, // SE
            81, 87, // PE
            82, // AL
            83, // PB
            84, // RN
            85, 88, // CE
            86, 89, // PI
            91, 93, 94, // PA
            92, 97, // AM
            95, // RR
            96, // AP
            98, 99 // MA
        ];

        return validDDDs.includes(ddd);
    }

    /**
     * Extrai DDD do telefone
     * @param {string} phone - Telefone com ou sem formatação
     * @returns {string} DDD (2 dígitos)
     * @throws {Error} Se telefone for inválido
     */
    static extractDDD(phone) {
        if (!this.validate(phone)) {
            throw new Error(`Telefone inválido: ${phone}`);
        }

        const digits = phone.replace(/\D/g, '');
        return digits.substring(0, 2);
    }

    /**
     * Verifica se telefone é de uma determinada região (DDD)
     * @param {string} phone - Telefone com ou sem formatação
     * @param {number} ddd - DDD a verificar
     * @returns {boolean} True se telefone for da região
     * @throws {Error} Se telefone for inválido
     */
    static isFromRegion(phone, ddd) {
        const phoneDDD = this.extractDDD(phone);
        return phoneDDD === String(ddd).padStart(2, '0');
    }
}
