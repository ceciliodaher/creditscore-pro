/* =====================================
   DATE-FORMATTER.JS
   Formatação de datas
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Formatação de datas (PT-BR, ISO, conversões)
 * Métodos estáticos, stateless, sem lógica de negócio
 */
export class DateFormatter {
    /**
     * Formata data no padrão brasileiro DD/MM/AAAA
     * @param {Date|string} date - Data a formatar
     * @returns {string} Data formatada (ex: 14/10/2025)
     * @throws {Error} Se data for inválida
     */
    static formatBR(date) {
        const dateObj = this.#parseDate(date);

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        return `${day}/${month}/${year}`;
    }

    /**
     * Formata data no padrão ISO AAAA-MM-DD
     * @param {Date|string} date - Data a formatar
     * @returns {string} Data formatada (ex: 2025-10-14)
     * @throws {Error} Se data for inválida
     */
    static formatISO(date) {
        const dateObj = this.#parseDate(date);

        const day = String(dateObj.getDate()).padStart(2, '0');
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const year = dateObj.getFullYear();

        return `${year}-${month}-${day}`;
    }

    /**
     * Formata data com hora no padrão brasileiro DD/MM/AAAA HH:MM
     * @param {Date|string} date - Data a formatar
     * @returns {string} Data e hora formatadas (ex: 14/10/2025 15:30)
     * @throws {Error} Se data for inválida
     */
    static formatBRWithTime(date) {
        const dateObj = this.#parseDate(date);

        const datePart = this.formatBR(dateObj);
        const hours = String(dateObj.getHours()).padStart(2, '0');
        const minutes = String(dateObj.getMinutes()).padStart(2, '0');

        return `${datePart} ${hours}:${minutes}`;
    }

    /**
     * Formata data no padrão extenso (ex: 14 de outubro de 2025)
     * @param {Date|string} date - Data a formatar
     * @returns {string} Data formatada por extenso
     * @throws {Error} Se data for inválida
     */
    static formatExtended(date) {
        const dateObj = this.#parseDate(date);

        return new Intl.DateTimeFormat('pt-BR', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(dateObj);
    }

    /**
     * Converte data BR (DD/MM/AAAA) para ISO (AAAA-MM-DD)
     * @param {string} dateBR - Data no formato DD/MM/AAAA
     * @returns {string} Data no formato ISO
     * @throws {Error} Se formato for inválido
     */
    static brToISO(dateBR) {
        const match = dateBR.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);

        if (!match) {
            throw new Error('Formato de data inválido. Esperado: DD/MM/AAAA');
        }

        const [, day, month, year] = match;

        return `${year}-${month}-${day}`;
    }

    /**
     * Converte data ISO (AAAA-MM-DD) para BR (DD/MM/AAAA)
     * @param {string} dateISO - Data no formato AAAA-MM-DD
     * @returns {string} Data no formato DD/MM/AAAA
     * @throws {Error} Se formato for inválido
     */
    static isoToBR(dateISO) {
        const match = dateISO.match(/^(\d{4})-(\d{2})-(\d{2})$/);

        if (!match) {
            throw new Error('Formato de data inválido. Esperado: AAAA-MM-DD');
        }

        const [, year, month, day] = match;

        return `${day}/${month}/${year}`;
    }

    /**
     * Parse data de string ou Date para Date object
     * @private
     * @param {Date|string} date - Data a parsear
     * @returns {Date} Objeto Date
     * @throws {Error} Se data for inválida
     */
    static #parseDate(date) {
        if (date instanceof Date) {
            if (isNaN(date.getTime())) {
                throw new Error('Data inválida');
            }
            return date;
        }

        if (typeof date === 'string') {
            // Tenta parsear ISO ou formato padrão
            const dateObj = new Date(date);

            if (isNaN(dateObj.getTime())) {
                // Tenta formato BR DD/MM/AAAA
                const match = date.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (match) {
                    const [, day, month, year] = match;
                    const brDate = new Date(year, parseInt(month) - 1, day);

                    if (isNaN(brDate.getTime())) {
                        throw new Error(`Data brasileira inválida: ${date}`);
                    }

                    return brDate;
                }

                throw new Error(`Formato de data não reconhecido: ${date}`);
            }

            return dateObj;
        }

        throw new Error(`Tipo de data não suportado: ${typeof date}`);
    }

    /**
     * Adiciona dias a uma data
     * @param {Date|string} date - Data base
     * @param {number} days - Dias a adicionar (pode ser negativo)
     * @returns {Date} Nova data
     * @throws {Error} Se data for inválida
     */
    static addDays(date, days) {
        const dateObj = this.#parseDate(date);
        const newDate = new Date(dateObj);
        newDate.setDate(newDate.getDate() + days);
        return newDate;
    }

    /**
     * Adiciona meses a uma data
     * @param {Date|string} date - Data base
     * @param {number} months - Meses a adicionar (pode ser negativo)
     * @returns {Date} Nova data
     * @throws {Error} Se data for inválida
     */
    static addMonths(date, months) {
        const dateObj = this.#parseDate(date);
        const newDate = new Date(dateObj);
        newDate.setMonth(newDate.getMonth() + months);
        return newDate;
    }

    /**
     * Calcula diferença em dias entre duas datas
     * @param {Date|string} date1 - Primeira data
     * @param {Date|string} date2 - Segunda data
     * @returns {number} Diferença em dias (positivo se date2 > date1)
     * @throws {Error} Se datas forem inválidas
     */
    static diffInDays(date1, date2) {
        const d1 = this.#parseDate(date1);
        const d2 = this.#parseDate(date2);

        const diffTime = d2.getTime() - d1.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
    }

    /**
     * Calcula diferença em meses entre duas datas
     * @param {Date|string} date1 - Primeira data
     * @param {Date|string} date2 - Segunda data
     * @returns {number} Diferença em meses (positivo se date2 > date1)
     * @throws {Error} Se datas forem inválidas
     */
    static diffInMonths(date1, date2) {
        const d1 = this.#parseDate(date1);
        const d2 = this.#parseDate(date2);

        const yearDiff = d2.getFullYear() - d1.getFullYear();
        const monthDiff = d2.getMonth() - d1.getMonth();

        return yearDiff * 12 + monthDiff;
    }
}
