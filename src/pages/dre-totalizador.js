/**
 * dre-totalizador.js
 * Totalizador Real-Time para Demonstração do Resultado do Exercício (DRE)
 *
 * Calcula e atualiza automaticamente todos os subtotais e totais
 * da DRE conforme o usuário preenche os campos.
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

class DRETotalizador {
    constructor() {
        console.log('📈 DRETotalizador inicializado');

        this.periodos = [1, 2, 3, 4];

        // Inicializar após pequeno delay para garantir que DOM está pronto
        setTimeout(() => this.init(), 150);
    }

    /**
     * Inicializa event listeners
     */
    init() {
        const inputsDRE = document.querySelectorAll('.input-valor[data-demonstrativo="dre"]');
        console.log(`📝 Encontrados ${inputsDRE.length} inputs de DRE`);

        inputsDRE.forEach(input => {
            input.addEventListener('input', () => {
                const periodo = input.dataset.periodo;
                if (periodo) {
                    this.calcularTotaisPeriodo(periodo);
                }
            });
        });

        this.periodos.forEach(p => this.calcularTotaisPeriodo(p));
        console.log('✅ Event listeners DRE configurados');
    }

    /**
     * Calcula todos os totais para um período específico
     * @param {string|number} periodo - Número do período (1-4)
     */
    calcularTotaisPeriodo(periodo) {
        const p = periodo.toString();

        // 1. RECEITA BRUTA
        const receitaBrutaTotal = this.getValor(`vendasProdutos_p${p}`) +
                                  this.getValor(`vendasServicos_p${p}`) +
                                  this.getValor(`outrasReceitas_p${p}`);
        this.setValor(`receitaBrutaTotal_p${p}`, receitaBrutaTotal);

        // 2. DEDUÇÕES
        const deducoesTotal = this.getValor(`icms_p${p}`) +
                              this.getValor(`pis_p${p}`) +
                              this.getValor(`cofins_p${p}`) +
                              this.getValor(`iss_p${p}`) +
                              this.getValor(`devolucoesVendas_p${p}`) +
                              this.getValor(`abatimentos_p${p}`);
        this.setValor(`deducoesTotal_p${p}`, deducoesTotal);

        // 3. RECEITA LÍQUIDA
        const receitaLiquida = receitaBrutaTotal - deducoesTotal;
        this.setValor(`receitaLiquida_p${p}`, receitaLiquida);

        // 4. CUSTOS OPERACIONAIS
        const custosTotal = this.getValor(`cmv_p${p}`) +
                            this.getValor(`materiaPrima_p${p}`) +
                            this.getValor(`maoObraDireta_p${p}`) +
                            this.getValor(`cif_p${p}`) +
                            this.getValor(`csp_p${p}`);
        this.setValor(`custosTotal_p${p}`, custosTotal);

        // 5. LUCRO BRUTO
        const lucroBruto = receitaLiquida - custosTotal;
        this.setValor(`lucroBruto_p${p}`, lucroBruto);
        this.setMargem(`margemBruta_p${p}`, lucroBruto, receitaLiquida);

        // 6. DESPESAS OPERACIONAIS
        const despesasVendasTotal = this.getValor(`comissoes_p${p}`) +
                                    this.getValor(`vendasMarketing_p${p}`) +
                                    this.getValor(`frete_p${p}`) +
                                    this.getValor(`outrasDespVendas_p${p}`);
        this.setValor(`despesasVendasTotal_p${p}`, despesasVendasTotal);

        const despesasAdminTotal = this.getValor(`pessoal_p${p}`) +
                                   this.getValor(`alugueis_p${p}`) +
                                   this.getValor(`utilidades_p${p}`) +
                                   this.getValor(`seguros_p${p}`) +
                                   this.getValor(`manutencao_p${p}`) +
                                   this.getValor(`tecnologiaInformacao_p${p}`) +
                                   this.getValor(`servicosProfissionais_p${p}`) +
                                   this.getValor(`administrativas_p${p}`);
        this.setValor(`despesasAdminTotal_p${p}`, despesasAdminTotal);

        const despesasOperacionaisTotal = despesasVendasTotal + despesasAdminTotal + this.getValor(`outrasDespesas_p${p}`);
        this.setValor(`despesasOperacionaisTotal_p${p}`, despesasOperacionaisTotal);

        // 7. EBITDA
        const ebitda = lucroBruto - despesasOperacionaisTotal;
        this.setValor(`ebitda_p${p}`, ebitda);
        this.setMargem(`margemEBITDA_p${p}`, ebitda, receitaLiquida);

        // 8. DEPRECIAÇÃO E AMORTIZAÇÃO
        const depreciacaoAmortizacaoTotal = this.getValor(`depreciacaoAmortizacao_p${p}`);
        this.setValor(`depreciacaoAmortizacaoTotal_p${p}`, depreciacaoAmortizacaoTotal);

        // 9. EBIT
        const ebit = ebitda - depreciacaoAmortizacaoTotal;
        this.setValor(`ebit_p${p}`, ebit);
        this.setMargem(`margemOperacional_p${p}`, ebit, receitaLiquida);

        // 10. RESULTADO FINANCEIRO
        const resultadoFinanceiroLiquido = this.getValor(`receitasFinanceiras_p${p}`) - this.getValor(`despesasFinanceiras_p${p}`);
        this.setValor(`resultadoFinanceiroLiquido_p${p}`, resultadoFinanceiroLiquido);

        // 11. OUTRAS RECEITAS/DESPESAS
        const outrasReceitasDespesasLiquido = this.getValor(`receitasNaoOperacionais_p${p}`) - this.getValor(`despesasNaoOperacionais_p${p}`);
        this.setValor(`outrasReceitasDespesasLiquido_p${p}`, outrasReceitasDespesasLiquido);

        // 12. LAIR
        const lair = ebit + resultadoFinanceiroLiquido + outrasReceitasDespesasLiquido;
        this.setValor(`lair_p${p}`, lair);

        // 13. IMPOSTOS SOBRE LUCRO
        const impostosSobreLucroTotal = this.getValor(`ir_p${p}`) + this.getValor(`csll_p${p}`);
        this.setValor(`impostosSobreLucroTotal_p${p}`, impostosSobreLucroTotal);

        // 14. LUCRO LÍQUIDO
        const lucroLiquido = lair - impostosSobreLucroTotal;
        this.setValor(`lucroLiquido_p${p}`, lucroLiquido);
        this.setMargem(`margemLiquida_p${p}`, lucroLiquido, receitaLiquida);
    }

    getValor(inputId) {
        const input = document.getElementById(inputId);
        if (!input || !input.value) return 0;
        const valorLimpo = input.value.replace(/[^\d,-]/g, '').replace(',', '.');
        return parseFloat(valorLimpo) || 0;
    }

    setValor(elementId, valor) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = this.formatarMoeda(valor);
            element.classList.toggle('negative-value', valor < 0);
        }
    }

    setMargem(elementId, numerador, denominador) {
        const element = document.getElementById(elementId);
        if (element) {
            const margem = (denominador !== 0) ? (numerador / denominador) * 100 : 0;
            element.textContent = `${margem.toFixed(2)}%`;
            element.classList.toggle('negative-value', margem < 0);
        }
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }
}

new DRETotalizador();