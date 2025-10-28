/**
 * dre-totalizador.js
 * Totalizador Real-Time para DRE (Demonstração do Resultado do Exercício)
 *
 * Calcula e atualiza automaticamente todos os subtotais, totais e margens
 * da DRE conforme usuário preenche os campos.
 *
 * Baseado em: balanco-totalizador.js
 *
 * Princípios:
 * - Real-time calculation (addEventListener 'input')
 * - NO FALLBACKS: valores ausentes = 0
 * - Direct DOM manipulation (getElementById)
 * - BRL currency formatting (Intl.NumberFormat)
 * - Cálculo de margens (%, não apenas valores)
 *
 * Estrutura: 30 contas de DRE organizadas hierarquicamente
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

class DRETotalizador {
    constructor() {
        console.log('📈 DRETotalizador inicializado');

        this.periodos = [1, 2, 3, 4];

        // Inicializar após pequeno delay para garantir que DOM está pronto
        setTimeout(() => this.init(), 100);
    }

    /**
     * Inicializa event listeners
     */
    init() {
        // Contar inputs da DRE (dentro do container #dre)
        const inputsDRE = document.querySelectorAll('#dre .input-valor');
        console.log(`📝 Encontrados ${inputsDRE.length} inputs de DRE`);

        // Adicionar listener em cada input
        inputsDRE.forEach(input => {
            input.addEventListener('input', () => {
                // Extrair período do ID (ex: vendasProdutos_p1 → 1)
                const match = input.id.match(/_p(\d)$/);
                if (match) {
                    const periodo = match[1];
                    this.calcularTotaisPeriodo(periodo);
                }
            });
        });

        // Calcular totais iniciais para todos os períodos
        this.periodos.forEach(p => this.calcularTotaisPeriodo(p));

        console.log('✅ Event listeners DRE configurados');
    }

    /**
     * Calcula todos os totais e margens para um período específico
     * @param {string|number} periodo - Número do período (1-4)
     */
    calcularTotaisPeriodo(periodo) {
        const p = periodo.toString();

        // ========================================
        // RECEITA BRUTA
        // ========================================

        const vendasProdutos = this.getValor(`vendasProdutos_p${p}`);
        const vendasServicos = this.getValor(`vendasServicos_p${p}`);
        const outrasReceitas = this.getValor(`outrasReceitas_p${p}`);

        const receitaBrutaTotal = vendasProdutos + vendasServicos + outrasReceitas;
        this.setValor(`receitaBrutaTotal_p${p}`, receitaBrutaTotal);

        // ========================================
        // DEDUÇÕES DA RECEITA BRUTA
        // ========================================

        const icms = this.getValor(`icms_p${p}`);
        const pis = this.getValor(`pis_p${p}`);
        const cofins = this.getValor(`cofins_p${p}`);
        const iss = this.getValor(`iss_p${p}`);
        const devolucoesVendas = this.getValor(`devolucoesVendas_p${p}`);
        const abatimentos = this.getValor(`abatimentos_p${p}`);

        const deducoesTotal = icms + pis + cofins + iss + devolucoesVendas + abatimentos;
        this.setValor(`deducoesTotal_p${p}`, deducoesTotal);

        // ========================================
        // RECEITA OPERACIONAL LÍQUIDA
        // ========================================

        const receitaLiquida = receitaBrutaTotal - deducoesTotal;
        this.setValor(`receitaLiquida_p${p}`, receitaLiquida);

        // ========================================
        // CUSTOS
        // ========================================

        const cmv = this.getValor(`cmv_p${p}`);
        const materiaPrima = this.getValor(`materiaPrima_p${p}`);
        const maoObraDireta = this.getValor(`maoObraDireta_p${p}`);
        const cif = this.getValor(`cif_p${p}`);
        const csp = this.getValor(`csp_p${p}`);

        const custosTotal = cmv + materiaPrima + maoObraDireta + cif + csp;
        this.setValor(`custosTotal_p${p}`, custosTotal);

        // ========================================
        // LUCRO BRUTO
        // ========================================

        const lucroBruto = receitaLiquida - custosTotal;
        this.setValor(`lucroBruto_p${p}`, lucroBruto);

        // Margem Bruta (%)
        const margemBruta = receitaLiquida !== 0 ? (lucroBruto / receitaLiquida) * 100 : 0;
        this.setValorPercentual(`margemBruta_p${p}`, margemBruta);

        // ========================================
        // DESPESAS OPERACIONAIS
        // ========================================

        // Despesas com Vendas
        const comissoes = this.getValor(`comissoes_p${p}`);
        const vendasMarketing = this.getValor(`vendasMarketing_p${p}`);
        const frete = this.getValor(`frete_p${p}`);
        const outrasDespVendas = this.getValor(`outrasDespVendas_p${p}`);
        const despesasVendasTotal = comissoes + vendasMarketing + frete + outrasDespVendas;
        this.setValor(`despesasVendasTotal_p${p}`, despesasVendasTotal);

        // Despesas Administrativas
        const pessoal = this.getValor(`pessoal_p${p}`);
        const alugueis = this.getValor(`alugueis_p${p}`);
        const utilidades = this.getValor(`utilidades_p${p}`);
        const seguros = this.getValor(`seguros_p${p}`);
        const manutencao = this.getValor(`manutencao_p${p}`);
        const tecnologiaInformacao = this.getValor(`tecnologiaInformacao_p${p}`);
        const servicosProfissionais = this.getValor(`servicosProfissionais_p${p}`);
        const administrativas = this.getValor(`administrativas_p${p}`);
        const despesasAdminTotal = pessoal + alugueis + utilidades + seguros + manutencao + tecnologiaInformacao + servicosProfissionais + administrativas;
        this.setValor(`despesasAdminTotal_p${p}`, despesasAdminTotal);

        // Outras Despesas Operacionais
        const outrasDespesas = this.getValor(`outrasDespesas_p${p}`);

        const despesasOperacionaisTotal = despesasVendasTotal + despesasAdminTotal + outrasDespesas;
        this.setValor(`despesasOperacionaisTotal_p${p}`, despesasOperacionaisTotal);

        // ========================================
        // EBITDA
        // ========================================

        const ebitda = lucroBruto - despesasOperacionaisTotal;
        this.setValor(`ebitda_p${p}`, ebitda);

        // Margem EBITDA (%)
        const margemEbitda = receitaLiquida !== 0 ? (ebitda / receitaLiquida) * 100 : 0;
        this.setValorPercentual(`margemEbitda_p${p}`, margemEbitda);

        // ========================================
        // DEPRECIAÇÃO E AMORTIZAÇÃO
        // ========================================

        const depreciacaoAmortizacao = this.getValor(`depreciacaoAmortizacao_p${p}`);
        const depreciacaoAmortizacaoTotal = depreciacaoAmortizacao;
        this.setValor(`depreciacaoAmortizacaoTotal_p${p}`, depreciacaoAmortizacaoTotal);

        // ========================================
        // EBIT / LUCRO OPERACIONAL
        // ========================================

        const ebit = ebitda - depreciacaoAmortizacaoTotal;
        this.setValor(`ebit_p${p}`, ebit);

        // Margem Operacional (%)
        const margemOperacional = receitaLiquida !== 0 ? (ebit / receitaLiquida) * 100 : 0;
        this.setValorPercentual(`margemOperacional_p${p}`, margemOperacional);

        // ========================================
        // RESULTADO FINANCEIRO
        // ========================================

        const receitasFinanceiras = this.getValor(`receitasFinanceiras_p${p}`);
        const despesasFinanceiras = this.getValor(`despesasFinanceiras_p${p}`);
        const resultadoFinanceiroLiquido = receitasFinanceiras - despesasFinanceiras;
        this.setValor(`resultadoFinanceiroLiquido_p${p}`, resultadoFinanceiroLiquido);

        // ========================================
        // OUTRAS RECEITAS E DESPESAS
        // ========================================

        const receitasNaoOperacionais = this.getValor(`receitasNaoOperacionais_p${p}`);
        const despesasNaoOperacionais = this.getValor(`despesasNaoOperacionais_p${p}`);
        const outrasReceitasDespesasLiquido = receitasNaoOperacionais - despesasNaoOperacionais;
        this.setValor(`outrasReceitasDespesasLiquido_p${p}`, outrasReceitasDespesasLiquido);

        // ========================================
        // LAIR (Lucro Antes do IR)
        // ========================================

        const lair = ebit + resultadoFinanceiroLiquido + outrasReceitasDespesasLiquido;
        this.setValor(`lair_p${p}`, lair);

        // ========================================
        // IMPOSTOS SOBRE O LUCRO
        // ========================================

        const ir = this.getValor(`ir_p${p}`);
        const csll = this.getValor(`csll_p${p}`);
        const impostosLucroTotal = ir + csll;
        this.setValor(`impostosLucroTotal_p${p}`, impostosLucroTotal);

        // ========================================
        // LUCRO LÍQUIDO
        // ========================================

        const lucroLiquido = lair - impostosLucroTotal;
        this.setValor(`lucroLiquido_p${p}`, lucroLiquido);

        // Margem Líquida (%)
        const margemLiquida = receitaLiquida !== 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;
        this.setValorPercentual(`margemLiquida_p${p}`, margemLiquida);
    }

    /**
     * Obtém valor numérico de um input formatado como moeda
     * @param {string} inputId - ID do input
     * @returns {number} Valor numérico
     */
    getValor(inputId) {
        const input = document.getElementById(inputId);
        if (!input || !input.value || input.value.trim() === '') {
            return 0;
        }

        // Remover formatação BRL: "R$ 1.234,56" → 1234.56
        const valorLimpo = input.value
            .replace(/[^\d,\-]/g, '')  // Remove tudo exceto dígitos, vírgula e hífen
            .replace(',', '.');         // Vírgula → ponto decimal

        return parseFloat(valorLimpo) || 0;
    }

    /**
     * Define valor formatado em elemento de total
     * @param {string} elementId - ID do elemento
     * @param {number} valor - Valor numérico
     */
    setValor(elementId, valor) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.formatarMoeda(valor);
        }
    }

    /**
     * Define valor percentual formatado
     * @param {string} elementId - ID do elemento
     * @param {number} percentual - Valor percentual (0-100)
     */
    setValorPercentual(elementId, percentual) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.formatarPercentual(percentual);
        }
    }

    /**
     * Formata número como moeda BRL
     * @param {number} valor - Valor numérico
     * @returns {string} Valor formatado
     */
    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    }

    /**
     * Formata número como percentual
     * @param {number} percentual - Valor percentual (0-100)
     * @returns {string} Valor formatado
     */
    formatarPercentual(percentual) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'percent',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(percentual / 100);
    }
}

// ====================================================================
// Inicialização
// ====================================================================

let totalizadorDREInstance = null;

/**
 * Inicializa o totalizador quando DOM estiver pronto
 */
function initDRETotalizador() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            totalizadorDREInstance = new DRETotalizador();
        });
    } else {
        totalizadorDREInstance = new DRETotalizador();
    }
}

// Auto-inicializar
if (typeof window !== 'undefined') {
    initDRETotalizador();

    // Disponibilizar globalmente
    window.DRETotalizador = DRETotalizador;
    window.dreTotalizador = totalizadorDREInstance;
}

// Export para ES6 modules
export default DRETotalizador;
