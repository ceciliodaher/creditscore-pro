/* =====================================
   DOCUMENT-FORMATTER.JS
   Formatação de documentos brasileiros
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Formatação de documentos brasileiros (CNPJ, CPF, RG)
 * Métodos estáticos, stateless, sem lógica de negócio
 */
export class DocumentFormatter {
    /**
     * Formata CNPJ no padrão 00.000.000/0000-00
     * @param {string} value - CNPJ sem formatação
     * @returns {string} CNPJ formatado
     * @throws {Error} Se CNPJ não tiver 14 dígitos
     */
    static formatCNPJ(value) {
        const digits = value.replace(/\D/g, '');

        if (digits.length !== 14) {
            throw new Error('CNPJ deve ter 14 dígitos para formatação');
        }

        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
    }

    /**
     * Formata CPF no padrão 000.000.000-00
     * @param {string} value - CPF sem formatação
     * @returns {string} CPF formatado
     * @throws {Error} Se CPF não tiver 11 dígitos
     */
    static formatCPF(value) {
        const digits = value.replace(/\D/g, '');

        if (digits.length !== 11) {
            throw new Error('CPF deve ter 11 dígitos para formatação');
        }

        return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }

    /**
     * Formata RG no padrão 00.000.000-0
     * @param {string} value - RG sem formatação
     * @returns {string} RG formatado
     * @throws {Error} Se RG não tiver 9 dígitos
     */
    static formatRG(value) {
        const digits = value.replace(/\D/g, '');

        if (digits.length !== 9) {
            throw new Error('RG deve ter 9 dígitos para formatação');
        }

        return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{1})/, '$1.$2.$3-$4');
    }

    /**
     * Remove formatação de documento
     * @param {string} value - Documento formatado
     * @returns {string} Apenas dígitos
     */
    static removeFormatting(value) {
        return value.replace(/\D/g, '');
    }
}
