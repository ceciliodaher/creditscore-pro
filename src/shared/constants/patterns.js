/* =====================================
   PATTERNS.JS
   Regex patterns compartilhados
   Compartilhado por TODOS os sistemas
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

/**
 * Padrões regex para validação de dados brasileiros
 * Constantes compartilhadas entre todos os sistemas
 */
export const PATTERNS = {
    /**
     * CNPJ formatado: 00.000.000/0000-00
     */
    CNPJ: /^\d{2}\.\d{3}\.\d{3}\/\d{4}\-\d{2}$/,

    /**
     * CNPJ apenas números: 14 dígitos
     */
    CNPJ_DIGITS: /^\d{14}$/,

    /**
     * CPF formatado: 000.000.000-00
     */
    CPF: /^\d{3}\.\d{3}\.\d{3}\-\d{2}$/,

    /**
     * CPF apenas números: 11 dígitos
     */
    CPF_DIGITS: /^\d{11}$/,

    /**
     * E-mail (RFC 5322 simplificado)
     */
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

    /**
     * E-mail rigoroso (RFC 5322)
     */
    EMAIL_STRICT: /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/,

    /**
     * Telefone celular formatado: (00) 00000-0000
     */
    PHONE_CELULAR: /^\(\d{2}\)\s?\d{5}\-?\d{4}$/,

    /**
     * Telefone fixo formatado: (00) 0000-0000
     */
    PHONE_FIXO: /^\(\d{2}\)\s?\d{4}\-?\d{4}$/,

    /**
     * Telefone (celular ou fixo) formatado
     */
    PHONE: /^\(\d{2}\)\s?\d{4,5}\-?\d{4}$/,

    /**
     * Telefone apenas números: 10 ou 11 dígitos
     */
    PHONE_DIGITS: /^(\d{10}|\d{11})$/,

    /**
     * CEP formatado: 00000-000
     */
    CEP: /^\d{5}\-\d{3}$/,

    /**
     * CEP apenas números: 8 dígitos
     */
    CEP_DIGITS: /^\d{8}$/,

    /**
     * Data brasileira: DD/MM/AAAA
     */
    DATE_BR: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/\d{4}$/,

    /**
     * Data ISO: AAAA-MM-DD
     */
    DATE_ISO: /^\d{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$/,

    /**
     * Hora: HH:MM
     */
    TIME: /^([01]\d|2[0-3]):([0-5]\d)$/,

    /**
     * Hora com segundos: HH:MM:SS
     */
    TIME_SECONDS: /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/,

    /**
     * Moeda brasileira: R$ 0.000,00
     */
    CURRENCY_BRL: /^R\$\s?\d{1,3}(\.\d{3})*(,\d{2})?$/,

    /**
     * Moeda USD: $ 0,000.00
     */
    CURRENCY_USD: /^\$\s?\d{1,3}(,\d{3})*(\.\d{2})?$/,

    /**
     * Percentual: 00.00%
     */
    PERCENTAGE: /^\d{1,3}(\.\d{1,2})?%$/,

    /**
     * Número inteiro
     */
    INTEGER: /^-?\d+$/,

    /**
     * Número decimal (ponto ou vírgula)
     */
    DECIMAL: /^-?\d+([.,]\d+)?$/,

    /**
     * URL
     */
    URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,

    /**
     * Placa de veículo (Mercosul): ABC1D23
     */
    PLACA_MERCOSUL: /^[A-Z]{3}\d[A-Z]\d{2}$/,

    /**
     * Placa de veículo (antiga): ABC-1234
     */
    PLACA_ANTIGA: /^[A-Z]{3}\-\d{4}$/,

    /**
     * Inscrição Estadual (genérica - varia por estado)
     */
    INSCRICAO_ESTADUAL: /^\d{9,14}$/,

    /**
     * Código NCM (Nomenclatura Comum do Mercosul): 8 dígitos
     */
    NCM: /^\d{8}$/,

    /**
     * Código CFOP (Código Fiscal de Operações e Prestações): 4 dígitos
     */
    CFOP: /^[1-7]\d{3}$/
};

/**
 * Mensagens de erro padrão para validações
 */
export const ERROR_MESSAGES = {
    REQUIRED: 'Este campo é obrigatório',
    INVALID_CNPJ: 'CNPJ inválido',
    INVALID_CPF: 'CPF inválido',
    INVALID_EMAIL: 'E-mail inválido',
    INVALID_PHONE: 'Telefone inválido',
    INVALID_CEP: 'CEP inválido',
    INVALID_DATE: 'Data inválida',
    INVALID_CURRENCY: 'Valor monetário inválido',
    INVALID_PERCENTAGE: 'Percentual inválido',
    INVALID_NUMBER: 'Número inválido',
    INVALID_URL: 'URL inválida',
    INVALID_PLACA: 'Placa de veículo inválida',
    MIN_LENGTH: (min) => `Mínimo de ${min} caracteres`,
    MAX_LENGTH: (max) => `Máximo de ${max} caracteres`,
    MIN_VALUE: (min) => `Valor mínimo: ${min}`,
    MAX_VALUE: (max) => `Valor máximo: ${max}`,
    BETWEEN: (min, max) => `Valor deve estar entre ${min} e ${max}`
};

/**
 * Máscaras de formatação
 */
export const MASKS = {
    CNPJ: '00.000.000/0000-00',
    CPF: '000.000.000-00',
    PHONE_CELULAR: '(00) 00000-0000',
    PHONE_FIXO: '(00) 0000-0000',
    CEP: '00000-000',
    DATE_BR: 'DD/MM/AAAA',
    DATE_ISO: 'AAAA-MM-DD',
    PLACA_MERCOSUL: 'ABC1D23',
    PLACA_ANTIGA: 'ABC-1234'
};
