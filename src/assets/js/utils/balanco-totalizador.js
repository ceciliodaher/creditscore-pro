/**
 * balanco-totalizador.js
 * Totalizador Real-Time para Balanço Patrimonial
 *
 * Calcula e atualiza automaticamente todos os subtotais e totais
 * do Balanço Patrimonial conforme usuário preenche os campos.
 *
 * Baseado em: percentage-calculator.js (padrão funcionando)
 *
 * Princípios:
 * - Real-time calculation (addEventListener 'input')
 * - NO FALLBACKS: valores ausentes = 0
 * - Direct DOM manipulation (getElementById)
 * - BRL currency formatting (Intl.NumberFormat)
 * - Validation: Ativo Total = Passivo + PL (✅/⚠️)
 *
 * Estrutura: 68 contas organizadas hierarquicamente
 *
 * @version 1.0.0
 * @date 2025-10-27
 */

class BalancoTotalizador {
    constructor() {
        console.log('📊 BalancoTotalizador inicializado');

        this.periodos = [1, 2, 3, 4];

        // Inicializar após pequeno delay para garantir que DOM está pronto
        setTimeout(() => this.init(), 100);
    }

    /**
     * Inicializa event listeners
     */
    init() {
        // Contar inputs do Balanço (têm data-demonstrativo="balanco")
        const inputsBalanco = document.querySelectorAll('.input-valor[data-demonstrativo="balanco"]');
        console.log(`📝 Encontrados ${inputsBalanco.length} inputs de Balanço`);

        // Adicionar listener em cada input
        inputsBalanco.forEach(input => {
            input.addEventListener('input', () => {
                // Extrair período do ID (ex: caixa_p1 → 1)
                const match = input.id.match(/_p(\d)$/);
                if (match) {
                    const periodo = match[1];
                    this.calcularTotaisPeriodo(periodo);
                }
            });
        });

        // Calcular totais iniciais para todos os períodos
        this.periodos.forEach(p => this.calcularTotaisPeriodo(p));

        console.log('✅ Event listeners configurados');
    }

    /**
     * Calcula todos os totais para um período específico
     * @param {string|number} periodo - Número do período (1-4)
     */
    calcularTotaisPeriodo(periodo) {
        const p = periodo.toString();

        // ========================================
        // ATIVO CIRCULANTE
        // ========================================

        // 1. Disponibilidades Total
        const caixa = this.getValor(`caixa_p${p}`);
        const bancos = this.getValor(`bancos_p${p}`);
        const aplicacoes = this.getValor(`aplicacoes_p${p}`);
        const disponibilidadesTotal = caixa + bancos + aplicacoes;
        this.setValor(`disponibilidadesTotal_p${p}`, disponibilidadesTotal);

        // 2. Contas a Receber Líquido
        const contasReceber = this.getValor(`contasReceber_p${p}`);
        const pdd = this.getValor(`pdd_p${p}`);
        const contasReceberLiquido = contasReceber - pdd;
        this.setValor(`contasReceberLiquido_p${p}`, contasReceberLiquido);

        // 3. Estoques Total
        const estoqueMP = this.getValor(`estoqueMP_p${p}`);
        const estoqueWIP = this.getValor(`estoqueWIP_p${p}`);
        const estoqueProdAcabados = this.getValor(`estoqueProdAcabados_p${p}`);
        const estoquePecasReposicao = this.getValor(`estoquePecasReposicao_p${p}`);
        const estoquesTotal = estoqueMP + estoqueWIP + estoqueProdAcabados + estoquePecasReposicao;
        this.setValor(`estoquesTotal_p${p}`, estoquesTotal);

        // 4. Ativo Circulante Total
        const impostosRecuperar = this.getValor(`impostosRecuperar_p${p}`);
        const adiantamentosFornecedores = this.getValor(`adiantamentosFornecedores_p${p}`);
        const outrosAC = this.getValor(`outrosAC_p${p}`);

        const ativoCirculanteTotal = disponibilidadesTotal + contasReceberLiquido +
                                      estoquesTotal + impostosRecuperar +
                                      adiantamentosFornecedores + outrosAC;
        this.setValor(`ativoCirculanteTotal_p${p}`, ativoCirculanteTotal);

        // ========================================
        // ATIVO NÃO CIRCULANTE
        // ========================================

        // 5. Realizável Longo Prazo Total
        const titulosReceberLP = this.getValor(`titulosReceberLP_p${p}`);
        const depositosJudiciais = this.getValor(`depositosJudiciais_p${p}`);
        const outrosCreditosLP = this.getValor(`outrosCreditosLP_p${p}`);
        const realizavelLPTotal = titulosReceberLP + depositosJudiciais + outrosCreditosLP;
        this.setValor(`realizavelLPTotal_p${p}`, realizavelLPTotal);

        // 6. Investimentos Total
        const participacoesSocietarias = this.getValor(`participacoesSocietarias_p${p}`);
        const outrosInvestimentos = this.getValor(`outrosInvestimentos_p${p}`);
        const investimentosTotal = participacoesSocietarias + outrosInvestimentos;
        this.setValor(`investimentosTotal_p${p}`, investimentosTotal);

        // 7. Imobilizado
        const terrenos = this.getValor(`terrenos_p${p}`);
        const edificacoes = this.getValor(`edificacoes_p${p}`);
        const maquinasEquipamentos = this.getValor(`maquinasEquipamentos_p${p}`);
        const veiculos = this.getValor(`veiculos_p${p}`);
        const moveisUtensilios = this.getValor(`moveisUtensilios_p${p}`);
        const equipamentosInformatica = this.getValor(`equipamentosInformatica_p${p}`);
        const imobilizadoAndamento = this.getValor(`imobilizadoAndamento_p${p}`);

        const imobilizadoBruto = terrenos + edificacoes + maquinasEquipamentos +
                                 veiculos + moveisUtensilios + equipamentosInformatica +
                                 imobilizadoAndamento;
        this.setValor(`imobilizadoBruto_p${p}`, imobilizadoBruto);

        const depreciacaoAcumulada = this.getValor(`depreciacaoAcumulada_p${p}`);
        const imobilizadoLiquido = imobilizadoBruto - depreciacaoAcumulada;
        this.setValor(`imobilizadoLiquido_p${p}`, imobilizadoLiquido);

        // 8. Intangível
        const software = this.getValor(`software_p${p}`);
        const marcasPatentes = this.getValor(`marcasPatentes_p${p}`);
        const goodwill = this.getValor(`goodwill_p${p}`);

        const intangivelBruto = software + marcasPatentes + goodwill;
        this.setValor(`intangivelBruto_p${p}`, intangivelBruto);

        const amortizacaoAcumulada = this.getValor(`amortizacaoAcumulada_p${p}`);
        const intangivelLiquido = intangivelBruto - amortizacaoAcumulada;
        this.setValor(`intangivelLiquido_p${p}`, intangivelLiquido);

        // 9. Ativo Não Circulante Total
        const ativoNaoCirculanteTotal = realizavelLPTotal + investimentosTotal +
                                         imobilizadoLiquido + intangivelLiquido;
        this.setValor(`ativoNaoCirculanteTotal_p${p}`, ativoNaoCirculanteTotal);

        // ========================================
        // PASSIVO CIRCULANTE
        // ========================================

        // 10. Obrigações Financeiras CP
        const emprestimosCP = this.getValor(`emprestimosCP_p${p}`);
        const obrigacoesFinanceirasCP = emprestimosCP; // Por enquanto, só empréstimos
        this.setValor(`obrigacoesFinanceirasCP_p${p}`, obrigacoesFinanceirasCP);

        // 11. Obrigações Trabalhistas
        const salariosPagar = this.getValor(`salariosPagar_p${p}`);
        const encargosSociaisPagar = this.getValor(`encargosSociaisPagar_p${p}`);
        const obrigacoesTrabalhistas = salariosPagar + encargosSociaisPagar;
        this.setValor(`obrigacoesTrabalhistas_p${p}`, obrigacoesTrabalhistas);

        // 12. Obrigações Fiscais
        const impostosPagar = this.getValor(`impostosRecolher_p${p}`);
        const obrigacoesFiscais = this.getValor(`obrigacoesFiscais_p${p}`);
        const obrigacoesFiscaisTotal = impostosPagar + obrigacoesFiscais;
        this.setValor(`obrigacoesFiscaisTotal_p${p}`, obrigacoesFiscaisTotal);

        // 13. Fornecedores e Adiantamentos
        const fornecedores = this.getValor(`fornecedores_p${p}`);
        const adiantamentosClientes = this.getValor(`adiantamentosClientes_p${p}`);
        const fornecedoresAdiantamentos = fornecedores + adiantamentosClientes;
        this.setValor(`fornecedoresAdiantamentos_p${p}`, fornecedoresAdiantamentos);

        // 14. Outros Passivos Circulantes
        const dividendosPagar = this.getValor(`dividendosPagar_p${p}`);
        const outrosPC = this.getValor(`outrosPC_p${p}`);
        const outrosPassivosCirculantes = dividendosPagar + outrosPC;
        this.setValor(`outrosPassivosCirculantes_p${p}`, outrosPassivosCirculantes);

        // 15. Passivo Circulante Total
        const passivoCirculanteTotal = obrigacoesFinanceirasCP + obrigacoesTrabalhistas +
                                        obrigacoesFiscaisTotal + fornecedoresAdiantamentos +
                                        outrosPassivosCirculantes;
        this.setValor(`passivoCirculanteTotal_p${p}`, passivoCirculanteTotal);

        // ========================================
        // PASSIVO NÃO CIRCULANTE
        // ========================================

        // 16. Obrigações Financeiras LP
        const emprestimosLP = this.getValor(`emprestimosLP_p${p}`);
        const financiamentosLP = this.getValor(`financiamentosImobiliarios_p${p}`);
        const debentures = this.getValor(`debentures_p${p}`);
        const obrigacoesFinanceirasLP = emprestimosLP + financiamentosLP + debentures;
        this.setValor(`obrigacoesFinanceirasLP_p${p}`, obrigacoesFinanceirasLP);

        // 17. Provisões
        const provisoesTrabalhistas = this.getValor(`provisoesTrabalhistas_p${p}`);
        const provisoesFiscais = this.getValor(`provisoesFiscais_p${p}`);
        const provisoesTotal = provisoesTrabalhistas + provisoesFiscais;
        this.setValor(`provisoesTotal_p${p}`, provisoesTotal);

        // 18. Outros Passivos Não Circulantes
        const outrosPNC = this.getValor(`outrosPNC_p${p}`);

        // 19. Passivo Não Circulante Total
        const passivoNaoCirculanteTotal = obrigacoesFinanceirasLP + provisoesTotal + outrosPNC;
        this.setValor(`passivoNaoCirculanteTotal_p${p}`, passivoNaoCirculanteTotal);

        // ========================================
        // PATRIMÔNIO LÍQUIDO
        // ========================================

        const capitalSocial = this.getValor(`capitalSocial_p${p}`);
        const reservaCapital = this.getValor(`reservaCapital_p${p}`);
        const reservaLucros = this.getValor(`reservaLucros_p${p}`);
        const reservaLegal = this.getValor(`reservaLegal_p${p}`);
        const lucrosPrejuizosAcumulados = this.getValor(`lucrosPrejuizosAcumulados_p${p}`);
        const ajustesAvaliacaoPatrimonial = this.getValor(`ajustesAvaliacaoPatrimonial_p${p}`);
        const acoesTesouraria = this.getValor(`acoesTesouraria_p${p}`);

        const patrimonioLiquidoTotal = capitalSocial + reservaCapital + reservaLucros +
                                        reservaLegal + lucrosPrejuizosAcumulados +
                                        ajustesAvaliacaoPatrimonial - acoesTesouraria;
        this.setValor(`patrimonioLiquidoTotal_p${p}`, patrimonioLiquidoTotal);

        // ========================================
        // TOTAIS PRINCIPAIS
        // ========================================

        const ativoTotal = ativoCirculanteTotal + ativoNaoCirculanteTotal;
        const passivoTotal = passivoCirculanteTotal + passivoNaoCirculanteTotal;
        const totalPassivoPL = passivoTotal + patrimonioLiquidoTotal;

        this.setValor(`ativoTotal_p${p}`, ativoTotal);
        this.setValor(`passivoTotal_p${p}`, passivoTotal);
        this.setValor(`totalPassivoPL_p${p}`, totalPassivoPL);

        // Validar equilíbrio
        this.validarEquilibrio(p, ativoTotal, totalPassivoPL);
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
     * Valida equilíbrio contábil (Ativo = Passivo + PL)
     * @param {string} periodo - Número do período
     * @param {number} ativoTotal - Total do ativo
     * @param {number} passivoPLTotal - Total do passivo + PL
     */
    validarEquilibrio(periodo, ativoTotal, passivoPLTotal) {
        const diferenca = Math.abs(ativoTotal - passivoPLTotal);
        const icone = document.getElementById(`validacao-p${periodo}`);

        if (icone) {
            if (diferenca < 0.01) {
                icone.textContent = '✅';
                icone.title = 'Balanço equilibrado';
                icone.style.color = '#22C55E';  // green-500
            } else {
                icone.textContent = '⚠️';
                icone.title = `Diferença: ${this.formatarMoeda(diferenca)}`;
                icone.style.color = '#EF4444';  // red-500
            }
        }
    }
}

// ====================================================================
// Inicialização
// ====================================================================

let totalizadorInstance = null;

/**
 * Inicializa o totalizador quando DOM estiver pronto
 */
function initBalancoTotalizador() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            totalizadorInstance = new BalancoTotalizador();
        });
    } else {
        totalizadorInstance = new BalancoTotalizador();
    }
}

// Auto-inicializar
if (typeof window !== 'undefined') {
    initBalancoTotalizador();

    // Disponibilizar globalmente
    window.BalancoTotalizador = BalancoTotalizador;
    window.balancoTotalizador = totalizadorInstance;
}

// Export para ES6 modules
export default BalancoTotalizador;
