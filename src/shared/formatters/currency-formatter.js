/* =====================================
   CURRENCY-FORMATTER.JS
   Formatação de valores monetários
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Formatação de valores monetários (BRL, USD, percentuais)
 * Métodos estáticos, stateless, sem lógica de negócio
 */
export class CurrencyFormatter {
    /**
     * Formata valor em Real Brasileiro (BRL)
     * @param {number|string} value - Valor a formatar
     * @returns {string} Valor formatado (ex: R$ 1.234,56)
     * @throws {Error} Se valor for inválido
     */
    static formatBRL(value) {
        const number = this.#parseNumericValue(value);

        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(number);
    }

    /**
     * Formata valor em Dólar Americano (USD)
     * @param {number|string} value - Valor a formatar
     * @returns {string} Valor formatado (ex: $ 1,234.56)
     * @throws {Error} Se valor for inválido
     */
    static formatUSD(value) {
        const number = this.#parseNumericValue(value);

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(number);
    }

    /**
     * Formata percentual
     * @param {number|string} value - Valor do percentual
     * @param {number} decimals - Casas decimais (padrão: 2)
     * @returns {string} Percentual formatado (ex: 12.34%)
     * @throws {Error} Se valor for inválido
     */
    static formatPercentage(value, decimals = 2) {
        const number = this.#parseNumericValue(value);

        if (number < 0 || number > 100) {
            throw new Error('Percentual deve estar entre 0 e 100');
        }

        return `${number.toFixed(decimals)}%`;
    }

    /**
     * Formata número genérico com separadores
     * @param {number|string} value - Valor a formatar
     * @param {number} decimals - Casas decimais (padrão: 2)
     * @returns {string} Número formatado (ex: 1.234,56)
     * @throws {Error} Se valor for inválido
     */
    static formatNumber(value, decimals = 2) {
        const number = this.#parseNumericValue(value);

        return new Intl.NumberFormat('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        }).format(number);
    }

    /**
     * Parse valor numérico de string ou number
     * @private
     * @param {number|string} value - Valor a parsear
     * @returns {number} Valor numérico
     * @throws {Error} Se não for possível parsear
     */
    static #parseNumericValue(value) {
        if (typeof value === 'number') {
            if (isNaN(value)) {
                throw new Error('Valor numérico inválido (NaN)');
            }
            return value;
        }

        if (typeof value === 'string') {
            // Remove caracteres não-numéricos exceto . e ,
            const cleanValue = value.replace(/[^\d.,]/g, '');
            // Substitui vírgula por ponto para parseFloat
            const normalized = cleanValue.replace(',', '.');
            const number = parseFloat(normalized);

            if (isNaN(number)) {
                throw new Error(`Valor monetário inválido: ${value}`);
            }

            return number;
        }

        throw new Error(`Tipo de valor não suportado: ${typeof value}`);
    }

    /**
     * Remove formatação monetária e retorna número
     * @param {string} formatted - Valor formatado
     * @returns {number} Valor numérico
     * @throws {Error} Se não for possível parsear
     */
    static parse(formatted) {
        return this.#parseNumericValue(formatted);
    }
}
