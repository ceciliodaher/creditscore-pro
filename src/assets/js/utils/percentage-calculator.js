/* =====================================
   PERCENTAGE-CALCULATOR.JS
   Cálculo e validação de percentuais de distribuição
   Produtos (Destinos) e Insumos (Origens)
   NO FALLBACKS - NO HARDCODED DATA
   ===================================== */

class PercentageCalculator {
    /**
     * Configura listeners para um produto específico (Destinos)
     * @param {number} index - Índice do produto (1-based)
     */
    static setupProductDestinations(index) {
        const fields = [
            `produto${index}DestinoGoiasPerc`,
            `produto${index}DestinoNoNeCoPerc`,
            `produto${index}DestinoSuSePerc`,
            `produto${index}ExportacaoPerc`
        ];

        fields.forEach(fieldName => {
            const input = document.querySelector(`[name="${fieldName}"]`);
            if (input) {
                input.addEventListener('input', () => {
                    this.calculateProductTotal(index, fields);
                });
            }
        });

        // Cálculo inicial
        this.calculateProductTotal(index, fields);
    }

    /**
     * Configura listeners para um insumo específico (Origens)
     * @param {number} index - Índice do insumo (1-based)
     */
    static setupInsumoOrigins(index) {
        const fields = [
            `insumo${index}OrigemGoiasPerc`,
            `insumo${index}OrigemNoNeCoPerc`,
            `insumo${index}OrigemSuSePerc`,
            `insumo${index}ImportacaoPerc`
        ];

        fields.forEach(fieldName => {
            const input = document.querySelector(`[name="${fieldName}"]`);
            if (input) {
                input.addEventListener('input', () => {
                    this.calculateInsumoTotal(index, fields);
                });
            }
        });

        // Cálculo inicial
        this.calculateInsumoTotal(index, fields);
    }

    /**
     * Calcula total de destinos de um produto
     * @param {number} index - Índice do produto
     * @param {Array<string>} fields - Nomes dos campos
     */
    static calculateProductTotal(index, fields) {
        let total = 0;

        fields.forEach(fieldName => {
            const input = document.querySelector(`[name="${fieldName}"]`);
            if (!input) return;

            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                total += value;
            }
        });

        // Atualizar display do total
        const totalElement = document.getElementById(`produto${index}TotalDestinos`);
        if (totalElement) {
            totalElement.textContent = `${total.toFixed(1)}%`;
        }

        // Atualizar validação
        const validationElement = document.getElementById(`produto${index}ValidacaoDestinos`);
        if (validationElement) {
            const isValid = Math.abs(total - 100) < 0.1; // Tolerância de 0.1%

            if (isValid) {
                validationElement.textContent = '✅ OK';
                validationElement.className = 'validation-status valid';
            } else {
                validationElement.textContent = '❌ Deve somar 100%';
                validationElement.className = 'validation-status invalid';
            }
        }

        return total;
    }

    /**
     * Calcula total de origens de um insumo
     * @param {number} index - Índice do insumo
     * @param {Array<string>} fields - Nomes dos campos
     */
    static calculateInsumoTotal(index, fields) {
        let total = 0;

        fields.forEach(fieldName => {
            const input = document.querySelector(`[name="${fieldName}"]`);
            if (!input) return;

            const value = parseFloat(input.value);
            if (!isNaN(value)) {
                total += value;
            }
        });

        // Atualizar display do total
        const totalElement = document.getElementById(`insumo${index}TotalOrigens`);
        if (totalElement) {
            totalElement.textContent = `${total.toFixed(1)}%`;
        }

        // Atualizar validação
        const validationElement = document.getElementById(`insumo${index}ValidacaoOrigens`);
        if (validationElement) {
            const isValid = Math.abs(total - 100) < 0.1; // Tolerância de 0.1%

            if (isValid) {
                validationElement.textContent = '✅ OK';
                validationElement.className = 'validation-status valid';
            } else {
                validationElement.textContent = '❌ Deve somar 100%';
                validationElement.className = 'validation-status invalid';
            }
        }

        return total;
    }

    /**
     * Inicializa todos os produtos
     * Busca dinamicamente quantos produtos existem no formulário
     */
    static initializeAllProducts() {
        let productIndex = 1;

        while (document.querySelector(`[name="produto${productIndex}DestinoGoiasPerc"]`)) {
            this.setupProductDestinations(productIndex);
            productIndex++;
        }

        console.log(`[PercentageCalculator] ${productIndex - 1} produtos inicializados`);
    }

    /**
     * Inicializa todos os insumos
     * Busca dinamicamente quantos insumos existem no formulário
     */
    static initializeAllInsumos() {
        let insumoIndex = 1;

        while (document.querySelector(`[name="insumo${insumoIndex}OrigemGoiasPerc"]`)) {
            this.setupInsumoOrigins(insumoIndex);
            insumoIndex++;
        }

        console.log(`[PercentageCalculator] ${insumoIndex - 1} insumos inicializados`);
    }

    /**
     * Inicialização completa
     * Configura produtos e insumos automaticamente
     */
    static initialize() {
        this.initializeAllProducts();
        this.initializeAllInsumos();
        console.log('[PercentageCalculator] Pronto para uso');
    }

    /**
     * Recalcula TODOS os totais (produtos + insumos)
     * Útil após importação de dados ou restauração
     */
    static recalculateAll() {
        // Re-calcular todos produtos
        let productIndex = 1;
        while (document.querySelector(`[name="produto${productIndex}DestinoGoiasPerc"]`)) {
            const fields = [
                `produto${productIndex}DestinoGoiasPerc`,
                `produto${productIndex}DestinoNoNeCoPerc`,
                `produto${productIndex}DestinoSuSePerc`,
                `produto${productIndex}ExportacaoPerc`
            ];
            this.calculateProductTotal(productIndex, fields);
            productIndex++;
        }

        // Re-calcular todos insumos
        let insumoIndex = 1;
        while (document.querySelector(`[name="insumo${insumoIndex}OrigemGoiasPerc"]`)) {
            const fields = [
                `insumo${insumoIndex}OrigemGoiasPerc`,
                `insumo${insumoIndex}OrigemNoNeCoPerc`,
                `insumo${insumoIndex}OrigemSuSePerc`,
                `insumo${insumoIndex}ImportacaoPerc`
            ];
            this.calculateInsumoTotal(insumoIndex, fields);
            insumoIndex++;
        }

        console.log(`[PercentageCalculator] Recálculo completo: ${productIndex - 1} produtos, ${insumoIndex - 1} insumos`);
    }
}

// Auto-inicialização quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        PercentageCalculator.initialize();
    });
} else {
    PercentageCalculator.initialize();
}

// Disponibilizar globalmente
window.PercentageCalculator = PercentageCalculator;
