/* =====================================
   EMAIL-VALIDATOR.JS
   Validação de e-mails (RFC 5322 simplificado)
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Validação de e-mails seguindo padrões RFC 5322 (simplificado)
 * Métodos estáticos, stateless, sem lógica de negócio
 */
export class EmailValidator {
    /**
     * Pattern RFC 5322 simplificado para e-mails
     * @private
     */
    static #EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    /**
     * Pattern mais rigoroso para validação completa
     * @private
     */
    static #EMAIL_PATTERN_STRICT = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

    /**
     * Valida e-mail com padrão simples
     * @param {string} email - E-mail a validar
     * @returns {boolean} True se e-mail válido
     */
    static validate(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }

        return this.#EMAIL_PATTERN.test(email.trim());
    }

    /**
     * Valida e-mail com padrão rigoroso (RFC 5322)
     * @param {string} email - E-mail a validar
     * @returns {boolean} True se e-mail válido
     */
    static validateStrict(email) {
        if (!email || typeof email !== 'string') {
            return false;
        }

        const trimmed = email.trim();

        // Validação de comprimento
        if (trimmed.length > 254) {
            return false; // RFC 5321
        }

        // Validação com pattern rigoroso
        return this.#EMAIL_PATTERN_STRICT.test(trimmed);
    }

    /**
     * Extrai domínio do e-mail
     * @param {string} email - E-mail completo
     * @returns {string} Domínio do e-mail
     * @throws {Error} Se e-mail for inválido
     */
    static extractDomain(email) {
        if (!this.validate(email)) {
            throw new Error(`E-mail inválido: ${email}`);
        }

        const parts = email.trim().split('@');
        return parts[1].toLowerCase();
    }

    /**
     * Extrai nome de usuário do e-mail (parte antes do @)
     * @param {string} email - E-mail completo
     * @returns {string} Nome de usuário
     * @throws {Error} Se e-mail for inválido
     */
    static extractUsername(email) {
        if (!this.validate(email)) {
            throw new Error(`E-mail inválido: ${email}`);
        }

        const parts = email.trim().split('@');
        return parts[0].toLowerCase();
    }

    /**
     * Normaliza e-mail (lowercase, trim)
     * @param {string} email - E-mail a normalizar
     * @returns {string} E-mail normalizado
     * @throws {Error} Se e-mail for inválido
     */
    static normalize(email) {
        if (!this.validate(email)) {
            throw new Error(`E-mail inválido: ${email}`);
        }

        return email.trim().toLowerCase();
    }
}
