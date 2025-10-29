/* =====================================
   CURRENCY-MASK.JS
   Máscara monetária brasileira com centavos automáticos
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

class CurrencyMask {
  constructor() {
    this.locale = 'pt-BR';
    this.currency = 'BRL';
    this.autoInitialize();
  }

  /**
   * Inicializa automaticamente todos os campos com data-mask="currency"
   */
  autoInitialize() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  /**
   * Aplica máscara a todos os campos currency
   */
  init() {
    const fields = document.querySelectorAll('[data-mask="currency"]');
    console.log(`💰 Aplicando máscara monetária a ${fields.length} campos`);

    fields.forEach(field => {
      this.applyMask(field);
    });
  }

  /**
   * Aplica máscara a um campo específico
   */
  applyMask(field) {
    // Aplicar máscara ao valor inicial (se houver)
    if (field.value) {
      field.value = this.format(field.value);
    }

    // Event listener para input (digitação em tempo real)
    field.addEventListener('input', (e) => {
      const cursorPosition = e.target.selectionStart;
      const oldLength = e.target.value.length;

      // Formatar valor
      e.target.value = this.format(e.target.value);

      // Ajustar posição do cursor (mantém UX fluida)
      const newLength = e.target.value.length;
      const newPosition = cursorPosition + (newLength - oldLength);
      e.target.setSelectionRange(newPosition, newPosition);
    });

    // Event listener para blur (ao sair do campo)
    field.addEventListener('blur', (e) => {
      if (e.target.value) {
        e.target.value = this.format(e.target.value);
      }
    });

    // Event listener para focus (ao entrar no campo)
    field.addEventListener('focus', (e) => {
      // Opcional: remover formatação para facilitar edição
      // e.target.value = this.unformat(e.target.value);
    });

    console.log(`✓ Máscara aplicada ao campo: ${field.name || field.id}`);
  }

  /**
   * Formata valor para moeda brasileira
   * Entrada: "250000" ou "2500.00" ou "R$ 2.500,00"
   * Saída: "R$ 2.500,00"
   */
  format(value) {
    if (!value) return '';

    const str = value.toString();

    // NOVO: Detectar se já possui decimal (ponto ou vírgula)
    // Caso típico: valores importados de JSON com ".00" explícito
    if (str.includes('.') || str.includes(',')) {
      // Já tem decimal, converter diretamente SEM dividir por 100
      const number = parseFloat(str.replace(',', '.'));

      if (isNaN(number)) return '';

      // Formatar com Intl.NumberFormat (padrão brasileiro)
      const formatted = new Intl.NumberFormat(this.locale, {
        style: 'currency',
        currency: this.currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(number);

      return formatted;
    }

    // Lógica ORIGINAL: Para digitação manual (sem decimais)
    // Remover tudo exceto dígitos
    let digits = str.replace(/[^0-9]/g, '');

    if (digits === '') return '';

    // Converter para número (centavos automáticos: divide por 100)
    let number = parseFloat(digits) / 100;

    // Formatar com Intl.NumberFormat (padrão brasileiro)
    const formatted = new Intl.NumberFormat(this.locale, {
      style: 'currency',
      currency: this.currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number);

    return formatted;
  }

  /**
   * Remove formatação e retorna número puro
   * Entrada: "R$ 2.500,00"
   * Saída: 2500.00
   */
  unformat(value) {
    if (!value) return 0;

    const str = value.toString();

    // NOVO: Detectar se já é um valor com decimal (antes da formatação)
    // Caso típico: valor importado de JSON ainda não formatado
    if (!str.includes('R$') && (str.includes('.') || str.includes(','))) {
      // É um número decimal puro (ex: "9972000.00"), converter diretamente
      const number = parseFloat(str.replace(',', '.'));
      return isNaN(number) ? 0 : number;
    }

    // Lógica ORIGINAL: Para valores já formatados (com R$) ou digitados
    // Remover tudo exceto dígitos
    const digits = str.replace(/\D/g, '');

    if (digits === '') return 0;

    // Converter para número (divide por 100 porque os últimos 2 dígitos são centavos)
    return parseFloat(digits) / 100;
  }

  /**
   * Retorna valor como número (para cálculos)
   */
  getValue(field) {
    return this.unformat(field.value);
  }

  /**
   * Define valor em um campo (aplicando máscara)
   */
  setValue(field, value) {
    field.value = this.format(value);
  }
}

// Criar instância global
const currencyMask = new CurrencyMask();

// Expor para uso global
if (typeof window !== 'undefined') {
  window.CurrencyMask = CurrencyMask;
  window.currencyMask = currencyMask;
}

// Expor helper functions para compatibilidade
window.formatCurrency = (value) => currencyMask.format(value);
window.unformatCurrency = (value) => currencyMask.unformat(value);

console.log('✓ Currency Mask Module carregado');
