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

    // Remover tudo exceto dígitos
    let digits = value.toString().replace(/\D/g, '');

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

    // Remover tudo exceto dígitos
    const digits = value.toString().replace(/\D/g, '');

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
