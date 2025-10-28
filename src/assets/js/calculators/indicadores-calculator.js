/**
 * =====================================
 * INDICADORES-CALCULATOR.JS
 * Calculador Completo de Indicadores Financeiros
 * =====================================
 *
 * Responsabilidades:
 * - Calcular 24 indicadores de Balanço Patrimonial
 * - Calcular 10 indicadores de DRE
 * - Classificar indicadores (bom/atenção/crítico)
 * - Separação de responsabilidades (FASE 1)
 *
 * Cobertura:
 * - Liquidez (4), Endividamento (4), Estrutura (3)
 * - Inadimplência (2), Evolução (1)
 * - Rentabilidade (2: ROE, ROA)
 * - Concentração (2: Clientes, Fornecedores)
 * - Capacidade Pagamento (1: Cobertura Juros)
 * - Ciclo Operacional (5: PMR, PME, PMP, CO, CF)
 * - Margens DRE (4), Estrutura Custos (3), Break-even (2), Alavancagem (1)
 *
 * Arquitetura: NO FALLBACKS
 * Config: indicadores-config.json (externo)
 * CreditScore Pro © 2025
 */

class IndicadoresCalculator {
    constructor(config = null) {
        this.config = config;
        this.parametros = config?.parametros || null;
        this.thresholds = config?.thresholds || null;
    }

    /**
     * Carrega configuração externa
     * @param {string} configPath - Caminho do JSON de configuração
     * @throws {Error} Se config não disponível
     */
    async carregarConfig(configPath = '/config/indicadores-config.json') {
        try {
            const response = await fetch(configPath);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.config = await response.json();
            this.parametros = this.config.parametros;
            this.thresholds = this.config.thresholds;
            console.log('[IndicadoresCalculator] Config carregada');
        } catch (error) {
            throw new Error(
                `IndicadoresCalculator: Config obrigatória não disponível em ${configPath} - ${error.message}`
            );
        }
    }

    /**
     * Valida se config foi carregada
     * @throws {Error} Se config não disponível
     */
    #validarConfig() {
        if (!this.config || !this.parametros || !this.thresholds) {
            throw new Error(
                'IndicadoresCalculator: Config não carregada - execute carregarConfig() primeiro'
            );
        }
    }

    // ==========================================
    // API PÚBLICA
    // ==========================================

    /**
     * Calcula indicadores (Balanço ou DRE)
     * @param {Object} dados - Dados do demonstrativo (último período ou com DRE para alguns indicadores)
     * @param {string} tipo - 'balanco' ou 'dre'
     * @param {Object} dadosComplementares - Dados adicionais (DRE para ROE/ROA, período anterior para evolução)
     * @returns {Object} Indicadores calculados com classificações
     * @throws {Error} Se tipo inválido ou dados ausentes
     */
    calcular(dados, tipo = 'balanco', dadosComplementares = {}) {
        this.#validarConfig();

        if (!dados || typeof dados !== 'object') {
            throw new Error('IndicadoresCalculator: dados obrigatórios');
        }

        if (tipo !== 'balanco' && tipo !== 'dre') {
            throw new Error(`IndicadoresCalculator: tipo '${tipo}' inválido (use 'balanco' ou 'dre')`);
        }

        console.log(`[Indicadores] Calculando indicadores de ${tipo}...`);

        if (tipo === 'balanco') {
            return this.#calcularIndicadoresBalanco(dados, dadosComplementares);
        } else {
            return this.#calcularIndicadoresDRE(dados);
        }
    }

    // ==========================================
    // INDICADORES DE BALANÇO (24 indicadores)
    // ==========================================

    #calcularIndicadoresBalanco(balanco, { dre, periodoAnterior } = {}) {
        const indicadores = {
            tipo: 'balanco',
            timestamp: Date.now(),

            // LIQUIDEZ (4 indicadores)
            liquidez: [
                this.#calcularComClassificacao('liquidezCorrente', this.#liquidezCorrente(balanco)),
                this.#calcularComClassificacao('liquidezSeca', this.#liquidezSeca(balanco)),
                this.#calcularComClassificacao('liquidezImediata', this.#liquidezImediata(balanco)),
                this.#calcularComClassificacao('liquidezGeral', this.#liquidezGeral(balanco))
            ],

            // ENDIVIDAMENTO (4 indicadores)
            endividamento: [
                this.#calcularComClassificacao('endividamentoGeral', this.#endividamentoGeral(balanco)),
                this.#calcularComClassificacao('endividamentoLP', this.#endividamentoLP(balanco)),
                this.#calcularComClassificacao('composicaoEndividamento', this.#composicaoEndividamento(balanco)),
                this.#calcularComClassificacao('garantiaCapitalProprio', this.#garantiaCapitalProprio(balanco))
            ],

            // ESTRUTURA (3 indicadores)
            estrutura: [
                this.#calcularComClassificacao('participacaoCapitalTerceiros', this.#participacaoCapitalTerceiros(balanco)),
                this.#calcularComClassificacao('imobilizacaoPatrimonio', this.#imobilizacaoPatrimonio(balanco)),
                this.#calcularComClassificacao('imobilizacaoRecursos', this.#imobilizacaoRecursos(balanco))
            ],

            // INADIMPLÊNCIA (2 indicadores)
            inadimplencia: [
                this.#calcularComClassificacao('inadimplenciaClientes', this.#inadimplenciaClientes(balanco)),
                this.#calcularComClassificacao('inadimplenciaFornecedores', this.#inadimplenciaFornecedores(balanco))
            ],

            // EVOLUÇÃO (1 indicador - requer período anterior)
            evolucao: periodoAnterior ? [
                this.#calcularComClassificacao('evolucaoPatrimonial', this.#evolucaoPatrimonial(balanco, periodoAnterior))
            ] : [],

            // RENTABILIDADE (2 indicadores - requer DRE)
            rentabilidade: dre ? [
                this.#calcularComClassificacao('roe', this.#roe(balanco, dre)),
                this.#calcularComClassificacao('roa', this.#roa(balanco, dre))
            ] : [],

            // CONCENTRAÇÃO (2 indicadores)
            concentracao: [
                this.#calcularComClassificacao('concentracaoClientes', this.#concentracaoClientes(balanco)),
                this.#calcularComClassificacao('concentracaoFornecedores', this.#concentracaoFornecedores(balanco))
            ],

            // CAPACIDADE PAGAMENTO (1 indicador - requer DRE)
            capacidadePagamento: dre ? [
                this.#calcularComClassificacao('coberturaJuros', this.#coberturaJuros(balanco, dre), false)
            ] : [],

            // CICLO OPERACIONAL (5 indicadores - requer DRE)
            cicloOperacional: dre ? [
                this.#calcularComClassificacao('prazoMedioRecebimento', this.#prazoMedioRecebimento(balanco, dre), false),
                this.#calcularComClassificacao('prazoMedioPagamento', this.#prazoMedioPagamento(balanco, dre), false),
                this.#calcularComClassificacao('prazoMedioEstoques', this.#prazoMedioEstoques(balanco, dre), false),
                this.#calcularComClassificacao('cicloOperacional', this.#cicloOperacional(balanco, dre), false),
                this.#calcularComClassificacao('cicloFinanceiro', this.#cicloFinanceiro(balanco, dre), false)
            ] : []
        };

        const totalCalculados = this.#contarIndicadoresCalculados(indicadores);
        console.log(`✓ [Indicadores] ${totalCalculados} indicadores de Balanço calculados`);
        return indicadores;
    }

    // ------------------------------------------
    // LIQUIDEZ (4 indicadores)
    // ------------------------------------------

    #liquidezCorrente(balanco) {
        const ac = balanco.ativoCirculanteTotal;
        const pc = balanco.passivoCirculanteTotal;

        if (ac === null || ac === undefined) {
            throw new Error('ativoCirculanteTotal obrigatório para Liquidez Corrente');
        }
        if (pc === null || pc === undefined) {
            throw new Error('passivoCirculanteTotal obrigatório para Liquidez Corrente');
        }
        if (pc === 0) return null;

        return ac / pc;
    }

    #liquidezSeca(balanco) {
        const ac = balanco.ativoCirculanteTotal;
        const estoques = balanco.estoquesTotal || 0;
        const pc = balanco.passivoCirculanteTotal;

        if (ac === null || ac === undefined) {
            throw new Error('ativoCirculanteTotal obrigatório para Liquidez Seca');
        }
        if (pc === null || pc === undefined) {
            throw new Error('passivoCirculanteTotal obrigatório para Liquidez Seca');
        }
        if (pc === 0) return null;

        return (ac - estoques) / pc;
    }

    #liquidezImediata(balanco) {
        const disponibilidades = balanco.disponibilidadesTotal;
        const pc = balanco.passivoCirculanteTotal;

        if (disponibilidades === null || disponibilidades === undefined) {
            throw new Error('disponibilidadesTotal obrigatório para Liquidez Imediata');
        }
        if (pc === null || pc === undefined) {
            throw new Error('passivoCirculanteTotal obrigatório para Liquidez Imediata');
        }
        if (pc === 0) return null;

        return disponibilidades / pc;
    }

    #liquidezGeral(balanco) {
        const ac = balanco.ativoCirculanteTotal;
        const anc = balanco.ativoNaoCirculanteTotal;
        const pc = balanco.passivoCirculanteTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;

        if (ac === null || ac === undefined || anc === null || anc === undefined ||
            pc === null || pc === undefined || pnc === null || pnc === undefined) {
            throw new Error('AC, ANC, PC e PNC obrigatórios para Liquidez Geral');
        }

        const totalPassivos = pc + pnc;
        if (totalPassivos === 0) return null;

        return (ac + anc) / totalPassivos;
    }

    // ------------------------------------------
    // ENDIVIDAMENTO (4 indicadores)
    // ------------------------------------------

    #endividamentoGeral(balanco) {
        const pc = balanco.passivoCirculanteTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;
        const ativoTotal = balanco.ativoTotal;

        if (pc === null || pc === undefined || pnc === null || pnc === undefined ||
            ativoTotal === null || ativoTotal === undefined) {
            throw new Error('PC, PNC e Ativo Total obrigatórios para Endividamento Geral');
        }
        if (ativoTotal === 0) return null;

        return ((pc + pnc) / ativoTotal) * 100;
    }

    #endividamentoLP(balanco) {
        const pnc = balanco.passivoNaoCirculanteTotal;
        const ativoTotal = balanco.ativoTotal;

        if (pnc === null || pnc === undefined || ativoTotal === null || ativoTotal === undefined) {
            throw new Error('PNC e Ativo Total obrigatórios para Endividamento LP');
        }
        if (ativoTotal === 0) return null;

        return (pnc / ativoTotal) * 100;
    }

    #composicaoEndividamento(balanco) {
        const pc = balanco.passivoCirculanteTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;

        if (pc === null || pc === undefined || pnc === null || pnc === undefined) {
            throw new Error('PC e PNC obrigatórios para Composição Endividamento');
        }

        const totalPassivos = pc + pnc;
        if (totalPassivos === 0) return null;

        return (pc / totalPassivos) * 100;
    }

    #garantiaCapitalProprio(balanco) {
        const pl = balanco.patrimonioLiquidoTotal;
        const ativoTotal = balanco.ativoTotal;

        if (pl === null || pl === undefined || ativoTotal === null || ativoTotal === undefined) {
            throw new Error('PL e Ativo Total obrigatórios para Garantia Capital Próprio');
        }
        if (ativoTotal === 0) return null;

        return (pl / ativoTotal) * 100;
    }

    // ------------------------------------------
    // ESTRUTURA (3 indicadores)
    // ------------------------------------------

    #participacaoCapitalTerceiros(balanco) {
        const pc = balanco.passivoCirculanteTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;
        const pl = balanco.patrimonioLiquidoTotal;

        if (pc === null || pc === undefined || pnc === null || pnc === undefined ||
            pl === null || pl === undefined) {
            throw new Error('PC, PNC e PL obrigatórios para Participação Capital Terceiros');
        }
        if (pl === 0) return null;

        return ((pc + pnc) / pl) * 100;
    }

    #imobilizacaoPatrimonio(balanco) {
        const anc = balanco.ativoNaoCirculanteTotal;
        const pl = balanco.patrimonioLiquidoTotal;

        if (anc === null || anc === undefined || pl === null || pl === undefined) {
            throw new Error('ANC e PL obrigatórios para Imobilização Patrimônio');
        }
        if (pl === 0) return null;

        return (anc / pl) * 100;
    }

    #imobilizacaoRecursos(balanco) {
        const anc = balanco.ativoNaoCirculanteTotal;
        const pl = balanco.patrimonioLiquidoTotal;
        const pnc = balanco.passivoNaoCirculanteTotal;

        if (anc === null || anc === undefined || pl === null || pl === undefined ||
            pnc === null || pnc === undefined) {
            throw new Error('ANC, PL e PNC obrigatórios para Imobilização Recursos');
        }

        const recursosNaoCorrente = pl + pnc;
        if (recursosNaoCorrente === 0) return null;

        return (anc / recursosNaoCorrente) * 100;
    }

    // ------------------------------------------
    // INADIMPLÊNCIA (2 indicadores)
    // ------------------------------------------

    #inadimplenciaClientes(balanco) {
        const valor90d = balanco.contasReceber90d;
        const valorTotal = balanco.contasReceber;

        if (valor90d === null || valor90d === undefined ||
            valorTotal === null || valorTotal === undefined || valorTotal === 0) {
            return null;
        }

        return (valor90d / valorTotal) * 100;
    }

    #inadimplenciaFornecedores(balanco) {
        const valor90d = balanco.contasPagar90d;
        const valorTotal = balanco.fornecedores;

        if (valor90d === null || valor90d === undefined ||
            valorTotal === null || valorTotal === undefined || valorTotal === 0) {
            return null;
        }

        return (valor90d / valorTotal) * 100;
    }

    // ------------------------------------------
    // EVOLUÇÃO (1 indicador)
    // ------------------------------------------

    #evolucaoPatrimonial(balanco, periodoAnterior) {
        const plAtual = balanco.patrimonioLiquidoTotal;
        const plAnterior = periodoAnterior?.patrimonioLiquidoTotal;

        if (plAtual === null || plAtual === undefined ||
            plAnterior === null || plAnterior === undefined || plAnterior === 0) {
            return null;
        }

        return ((plAtual / plAnterior) - 1) * 100;
    }

    // ------------------------------------------
    // RENTABILIDADE (2 indicadores - requer DRE)
    // ------------------------------------------

    #roe(balanco, dre) {
        const lucroLiquido = this.#obterValorDRE(dre, 'lucroLiquido');
        const pl = balanco.patrimonioLiquidoTotal;

        if (lucroLiquido === null || pl === null || pl === undefined || pl === 0) {
            return null;
        }

        return (lucroLiquido / pl) * 100;
    }

    #roa(balanco, dre) {
        const lucroLiquido = this.#obterValorDRE(dre, 'lucroLiquido');
        const ativoTotal = balanco.ativoTotal;

        if (lucroLiquido === null || ativoTotal === null || ativoTotal === undefined || ativoTotal === 0) {
            return null;
        }

        return (lucroLiquido / ativoTotal) * 100;
    }

    // ------------------------------------------
    // CONCENTRAÇÃO (2 indicadores)
    // ------------------------------------------

    #concentracaoClientes(balanco) {
        const top5Clientes = balanco.top5ClientesReceita;
        const receitaTotal = balanco.receitaTotal || balanco.receitaLiquida;

        if (top5Clientes === null || top5Clientes === undefined ||
            receitaTotal === null || receitaTotal === undefined || receitaTotal === 0) {
            return null;
        }

        return (top5Clientes / receitaTotal) * 100;
    }

    #concentracaoFornecedores(balanco) {
        const top5Fornecedores = balanco.top5FornecedoresCompras;
        const comprasTotal = balanco.comprasTotal || balanco.cmvCpv;

        if (top5Fornecedores === null || top5Fornecedores === undefined ||
            comprasTotal === null || comprasTotal === undefined || comprasTotal === 0) {
            return null;
        }

        return (top5Fornecedores / comprasTotal) * 100;
    }

    // ------------------------------------------
    // CAPACIDADE PAGAMENTO (1 indicador - requer DRE)
    // ------------------------------------------

    #coberturaJuros(balanco, dre) {
        const ebit = this.#obterValorDRE(dre, 'ebit');
        const despesasFinanceiras = this.#obterValorDRE(dre, 'despesasFinanceiras');

        if (ebit === null || despesasFinanceiras === null || despesasFinanceiras === 0) {
            return null;
        }

        return ebit / despesasFinanceiras;
    }

    // ------------------------------------------
    // CICLO OPERACIONAL (5 indicadores - requer DRE)
    // ------------------------------------------

    #prazoMedioRecebimento(balanco, dre) {
        const contasReceber = balanco.contasReceber;
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');

        if (contasReceber === null || contasReceber === undefined ||
            receitaLiquida === null || receitaLiquida === 0) {
            return null;
        }

        return (contasReceber / receitaLiquida) * 360;
    }

    #prazoMedioPagamento(balanco, dre) {
        const fornecedores = balanco.fornecedores;
        const cmv = this.#obterValorDRE(dre, 'cmvCpv');

        if (fornecedores === null || fornecedores === undefined ||
            cmv === null || cmv === 0) {
            return null;
        }

        return (fornecedores / cmv) * 360;
    }

    #prazoMedioEstoques(balanco, dre) {
        const estoques = balanco.estoquesTotal;
        const cmv = this.#obterValorDRE(dre, 'cmvCpv');

        if (estoques === null || estoques === undefined ||
            cmv === null || cmv === 0) {
            return null;
        }

        return (estoques / cmv) * 360;
    }

    #cicloOperacional(balanco, dre) {
        const pmr = this.#prazoMedioRecebimento(balanco, dre);
        const pme = this.#prazoMedioEstoques(balanco, dre);

        if (pmr === null || pme === null) {
            return null;
        }

        return pmr + pme;
    }

    #cicloFinanceiro(balanco, dre) {
        const co = this.#cicloOperacional(balanco, dre);
        const pmp = this.#prazoMedioPagamento(balanco, dre);

        if (co === null || pmp === null) {
            return null;
        }

        return co - pmp;
    }

    // ==========================================
    // INDICADORES DE DRE (10 indicadores)
    // ==========================================

    #calcularIndicadoresDRE(dre) {
        const indicadores = {
            tipo: 'dre',
            timestamp: Date.now(),

            margens: [
                this.#calcularComClassificacao('margemBruta', this.#margemBruta(dre)),
                this.#calcularComClassificacao('margemEbitda', this.#margemEbitda(dre)),
                this.#calcularComClassificacao('margemOperacional', this.#margemOperacional(dre)),
                this.#calcularComClassificacao('margemLiquida', this.#margemLiquida(dre))
            ],

            estruturaCustos: [
                this.#calcularComClassificacao('custosVariaveis', this.#custosVariaveis(dre)),
                this.#calcularComClassificacao('custosFixos', this.#custosFixos(dre)),
                this.#calcularComClassificacao('margemContribuicao', this.#margemContribuicao(dre))
            ],

            breakeven: [
                this.#calcularComClassificacao('pontoEquilibrio', this.#pontoEquilibrio(dre), false),
                this.#calcularComClassificacao('margemSeguranca', this.#margemSeguranca(dre))
            ],

            alavancagem: [
                this.#calcularComClassificacao('grauAlavancagem', this.#grauAlavancagem(dre), false)
            ]
        };

        console.log('✓ [Indicadores] 10 indicadores de DRE calculados');
        return indicadores;
    }

    // ------------------------------------------
    // MARGENS (4 indicadores)
    // ------------------------------------------

    #margemBruta(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const lucroBruto = this.#obterValorDRE(dre, 'lucroBruto');

        if (receitaLiquida === null || lucroBruto === null || receitaLiquida === 0) {
            return null;
        }

        return (lucroBruto / receitaLiquida) * 100;
    }

    #margemEbitda(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const ebitda = this.#obterValorDRE(dre, 'ebitda');

        if (receitaLiquida === null || ebitda === null || receitaLiquida === 0) {
            return null;
        }

        return (ebitda / receitaLiquida) * 100;
    }

    #margemOperacional(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const ebit = this.#obterValorDRE(dre, 'ebit');

        if (receitaLiquida === null || ebit === null || receitaLiquida === 0) {
            return null;
        }

        return (ebit / receitaLiquida) * 100;
    }

    #margemLiquida(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const lucroLiquido = this.#obterValorDRE(dre, 'lucroLiquido');

        if (receitaLiquida === null || lucroLiquido === null || receitaLiquida === 0) {
            return null;
        }

        return (lucroLiquido / receitaLiquida) * 100;
    }

    // ------------------------------------------
    // ESTRUTURA DE CUSTOS (3 indicadores)
    // ------------------------------------------

    #custosVariaveis(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const custosTotal = this.#obterValorDRE(dre, 'custosTotal');

        if (receitaLiquida === null || custosTotal === null || receitaLiquida === 0) {
            return null;
        }

        return (custosTotal / receitaLiquida) * 100;
    }

    #custosFixos(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const despesasOp = this.#obterValorDRE(dre, 'despesasOperacionais');

        if (receitaLiquida === null || despesasOp === null || receitaLiquida === 0) {
            return null;
        }

        return (despesasOp / receitaLiquida) * 100;
    }

    #margemContribuicao(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const lucroBruto = this.#obterValorDRE(dre, 'lucroBruto');

        if (receitaLiquida === null || lucroBruto === null || receitaLiquida === 0) {
            return null;
        }

        return (lucroBruto / receitaLiquida) * 100;
    }

    // ------------------------------------------
    // BREAK-EVEN (2 indicadores)
    // ------------------------------------------

    #pontoEquilibrio(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const lucroBruto = this.#obterValorDRE(dre, 'lucroBruto');
        const despesasOp = this.#obterValorDRE(dre, 'despesasOperacionais');

        if (receitaLiquida === null || lucroBruto === null || despesasOp === null || receitaLiquida === 0) {
            return null;
        }

        const margemContribDecimal = lucroBruto / receitaLiquida;
        if (margemContribDecimal === 0) {
            throw new Error('Margem de Contribuição = 0 - impossível calcular ponto de equilíbrio');
        }

        return despesasOp / margemContribDecimal;
    }

    #margemSeguranca(dre) {
        const receitaLiquida = this.#obterValorDRE(dre, 'receitaLiquida');
        const pontoEquilibrio = this.#pontoEquilibrio(dre);

        if (receitaLiquida === null || pontoEquilibrio === null || receitaLiquida === 0) {
            return null;
        }

        return ((receitaLiquida - pontoEquilibrio) / receitaLiquida) * 100;
    }

    // ------------------------------------------
    // ALAVANCAGEM (1 indicador)
    // ------------------------------------------

    #grauAlavancagem(dre) {
        const lucroBruto = this.#obterValorDRE(dre, 'lucroBruto');
        const ebit = this.#obterValorDRE(dre, 'ebit');

        if (lucroBruto === null || ebit === null || ebit === 0) {
            return null;
        }

        return lucroBruto / ebit;
    }

    // ==========================================
    // MÉTODOS AUXILIARES
    // ==========================================

    /**
     * Obtém valor de uma conta da DRE
     * Suporta notação de caminho (ex: 'lucroBruto.valor') e acesso direto (ex: 'lucroLiquido')
     */
    #obterValorDRE(dre, nomeConta) {
        const caminhos = nomeConta.split('.');
        let valor = dre;

        for (const caminho of caminhos) {
            if (valor && typeof valor === 'object') {
                valor = valor[caminho];
            } else {
                break;
            }
        }

        // Também tentar acesso direto
        if (valor === undefined && dre[nomeConta] !== undefined) {
            valor = dre[nomeConta];
        }

        // Se ainda undefined, tentar variações comuns
        if (valor === undefined) {
            // Para campos que podem ter .valor
            if (dre[nomeConta + '.valor'] !== undefined) {
                valor = dre[nomeConta + '.valor'];
            }
            // Para totais de seções
            if (dre[nomeConta] && typeof dre[nomeConta] === 'object' && dre[nomeConta].total !== undefined) {
                valor = dre[nomeConta].total;
            }
        }

        return valor !== undefined ? valor : null;
    }

    /**
     * Calcula indicador com classificação
     */
    #calcularComClassificacao(nomeIndicador, valor, isPercentual = true) {
        if (valor === null || valor === undefined) {
            return {
                nome: nomeIndicador,
                label: this.parametros[nomeIndicador]?.label || nomeIndicador,
                valor: null,
                classificacao: 'Sem dados',
                emoji: '⚪',
                isPercentual
            };
        }

        const classificacao = this.#classificarIndicador(nomeIndicador, valor);

        return {
            nome: nomeIndicador,
            label: this.parametros[nomeIndicador]?.label || nomeIndicador,
            valor: parseFloat(valor.toFixed(2)),
            classificacao: classificacao.nivel,
            emoji: classificacao.emoji,
            descricao: classificacao.descricao,
            isPercentual
        };
    }

    /**
     * Classifica indicador segundo thresholds
     */
    #classificarIndicador(nomeIndicador, valor) {
        const threshold = this.thresholds[nomeIndicador];

        if (!threshold) {
            return {
                nivel: 'Neutro',
                emoji: '⚪',
                descricao: 'Sem parâmetros de classificação'
            };
        }

        // Verificar faixas: bom, atencao, critico
        if (threshold.bom && this.#valorNaFaixa(valor, threshold.bom)) {
            return {
                nivel: 'Bom',
                emoji: '🟢',
                descricao: threshold.bom.descricao || 'Dentro do ideal'
            };
        } else if (threshold.atencao && this.#valorNaFaixa(valor, threshold.atencao)) {
            return {
                nivel: 'Atenção',
                emoji: '🟡',
                descricao: threshold.atencao.descricao || 'Requer atenção'
            };
        } else if (threshold.critico && this.#valorNaFaixa(valor, threshold.critico)) {
            return {
                nivel: 'Crítico',
                emoji: '🔴',
                descricao: threshold.critico.descricao || 'Situação crítica'
            };
        }

        return {
            nivel: 'Neutro',
            emoji: '⚪',
            descricao: 'Fora dos parâmetros definidos'
        };
    }

    /**
     * Verifica se valor está dentro de uma faixa
     */
    #valorNaFaixa(valor, faixa) {
        const { min, max } = faixa;

        if (min !== undefined && max !== undefined) {
            return valor >= min && valor < max;
        } else if (min !== undefined) {
            return valor >= min;
        } else if (max !== undefined) {
            return valor < max;
        }

        return false;
    }

    /**
     * Conta quantos indicadores foram calculados (não-null)
     */
    #contarIndicadoresCalculados(indicadores) {
        let total = 0;
        for (const categoria in indicadores) {
            if (Array.isArray(indicadores[categoria])) {
                total += indicadores[categoria].filter(ind => ind.valor !== null).length;
            }
        }
        return total;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.IndicadoresCalculator = IndicadoresCalculator;
}

export default IndicadoresCalculator;
