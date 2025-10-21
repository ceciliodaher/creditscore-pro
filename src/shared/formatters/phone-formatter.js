/* =====================================
   PHONE-FORMATTER.JS
   Formatação de telefones brasileiros
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Formatação de telefones brasileiros
 * Métodos estáticos, stateless, sem lógica de negócio
 */
export class PhoneFormatter {
    /**
     * Formata telefone celular no padrão (00) 00000-0000
     * @param {string} value - Telefone sem formatação
     * @returns {string} Telefone formatado
     * @throws {Error} Se telefone não tiver 11 dígitos
     */
    static formatCelular(value) {
        const digits = value.replace(/\D/g, '');

        if (digits.length !== 11) {
            throw new Error('Celular deve ter 11 dígitos (DDD + 9 dígitos)');
        }

        return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }

    /**
     * Formata telefone fixo no padrão (00) 0000-0000
     * @param {string} value - Telefone sem formatação
     * @returns {string} Telefone formatado
     * @throws {Error} Se telefone não tiver 10 dígitos
     */
    static formatFixo(value) {
        const digits = value.replace(/\D/g, '');

        if (digits.length !== 10) {
            throw new Error('Telefone fixo deve ter 10 dígitos (DDD + 8 dígitos)');
        }

        return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }

    /**
     * Formata telefone automaticamente (detecta celular ou fixo)
     * @param {string} value - Telefone sem formatação
     * @returns {string} Telefone formatado
     * @throws {Error} Se telefone não tiver 10 ou 11 dígitos
     */
    static format(value) {
        const digits = value.replace(/\D/g, '');

        if (digits.length === 11) {
            return this.formatCelular(value);
        } else if (digits.length === 10) {
            return this.formatFixo(value);
        } else {
            throw new Error('Telefone deve ter 10 (fixo) ou 11 (celular) dígitos');
        }
    }

    /**
     * Remove formatação de telefone
     * @param {string} value - Telefone formatado
     * @returns {string} Apenas dígitos
     */
    static removeFormatting(value) {
        return value.replace(/\D/g, '');
    }

    /**
     * Valida se é telefone celular (9 no começo do número)
     * @param {string} value - Telefone (com ou sem formatação)
     * @returns {boolean} True se for celular
     */
    static isCelular(value) {
        const digits = this.removeFormatting(value);

        if (digits.length !== 11) {
            return false;
        }

        // Terceiro dígito deve ser 9 (celular)
        return digits.charAt(2) === '9';
    }

    /**
     * Valida se é telefone fixo
     * @param {string} value - Telefone (com ou sem formatação)
     * @returns {boolean} True se for fixo
     */
    static isFixo(value) {
        const digits = this.removeFormatting(value);

        if (digits.length !== 10) {
            return false;
        }

        // Terceiro dígito não pode ser 9 (fixo)
        return digits.charAt(2) !== '9';
    }
}
