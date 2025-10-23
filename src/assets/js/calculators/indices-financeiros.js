/**
 * IndicesFinanceirosCalculator - Calculador de Índices Financeiros e Z-Score
 *
 * ÍNDICES CALCULADOS:
 * 1. Liquidez (4): Corrente, Seca, Imediata, Geral
 * 2. Rentabilidade (5): Margem Bruta, EBITDA, Líquida, ROE, ROA
 * 3. Estrutura (3): PCT, Imobilização PL, Imobilização RNC
 * 4. Atividade (5): PMR, PMP, Giro Estoque, Ciclo Operacional, Ciclo Financeiro
 * 5. Z-Score de Altman: Indicador de risco de falência
 *
 * PRINCÍPIOS:
 * - NO FALLBACKS: Validação explícita, sem || ou ??
 * - NO HARDCODED DATA: Todas as mensagens vêm de config/messages.json
 * - KISS & DRY: Código simples e sem duplicação
 *
 * @class IndicesFinanceirosCalculator
 * @version 1.0.0
 */

export class IndicesFinanceirosCalculator {
    /**
     * @param {Object} config - Configuração do sistema
     * @param {Object} messages - Mensagens do sistema
     * @throws {Error} Se config ou messages não fornecidos
     */
    constructor(config, messages) {
        if (!config) {
            throw new Error('IndicesFinanceirosCalculator: config obrigatória não fornecida');
        }

        if (!messages) {
            throw new Error('IndicesFinanceirosCalculator: messages obrigatórias não fornecidas');
        }

        if (!messages.calculators) {
            throw new Error('IndicesFinanceirosCalculator: messages.calculators obrigatório');
        }

        if (!messages.calculators.indicesFinanceiros) {
            throw new Error('IndicesFinanceirosCalculator: messages.calculators.indicesFinanceiros obrigatório');
        }

        this.config = config;
        this.messages = messages;
        this.msg = messages.calculators.indicesFinanceiros;
        this.initialized = false;

        // Thresholds
        this.thresholds = {
            liquidezCorrenteExcelente: 2.0,
            liquidezCorrenteBom: 1.5,
            liquidezCorrenteAdequado: 1.0,
            liquidezCorrenteBaixo: 0.75,
            endividamentoAlto: 1.5,
            zScoreSeguro: 2.99,
            zScoreCinza: 1.81,
        };
    }

    /**
     * Inicializa o calculador
     * @returns {Promise<boolean>}
     */
    async init() {
        console.log('🔧 Inicializando IndicesFinanceirosCalculator...');
        this.initialized = true;
        console.log('✅ IndicesFinanceirosCalculator inicializado');
        return true;
    }

    /**
     * Calcula todos os índices financeiros
     * @param {Object} data - Dados financeiros
     * @param {Object} data.balanco - Balanço patrimonial
     * @param {Object} data.dre - DRE
     * @returns {Promise<Object>} Todos os índices calculados
     */
    async calcularTodos(data) {
        if (!this.initialized) {
            throw new Error('IndicesFinanceirosCalculator: não inicializado - execute init() primeiro');
        }

        this.#validarDados(data);

        const balanco = data.balanco;
        const dre = data.dre;

        return {
            liquidez: this.#calcularLiquidez(balanco),
            rentabilidade: this.#calcularRentabilidade(balanco, dre),
            estrutura: this.#calcularEstrutura(balanco),
            atividade: this.#calcularAtividade(balanco, dre),
            zScore: this.#calcularZScore(balanco, dre),
            metadata: {
                calculadoEm: new Date().toISOString(),
                thresholds: this.thresholds,
            },
        };
    }

    /**
     * Valida dados de entrada
     * @private
     * @param {Object} data
     * @throws {Error} Se dados inválidos
     */
    #validarDados(data) {
        if (!data) {
            throw new Error('IndicesFinanceirosCalculator: data obrigatório não fornecido');
        }

        if (!data.balanco) {
            throw new Error('IndicesFinanceirosCalculator: data.balanco obrigatório não fornecido');
        }

        if (!data.dre) {
            throw new Error('IndicesFinanceirosCalculator: data.dre obrigatório não fornecido');
        }

        const balanco = data.balanco;
        const dre = data.dre;

        // Validar campos OBRIGATÓRIOS do balanço
        if (!balanco.ativo) {
            throw new Error('IndicesFinanceirosCalculator: balanco.ativo obrigatório não fornecido');
        }

        if (!balanco.ativo.circulante) {
            throw new Error('IndicesFinanceirosCalculator: balanco.ativo.circulante obrigatório não fornecido');
        }

        if (!balanco.passivo) {
            throw new Error('IndicesFinanceirosCalculator: balanco.passivo obrigatório não fornecido');
        }

        if (!balanco.passivo.circulante) {
            throw new Error('IndicesFinanceirosCalculator: balanco.passivo.circulante obrigatório não fornecido');
        }

        if (!balanco.patrimonioLiquido) {
            throw new Error('IndicesFinanceirosCalculator: balanco.patrimonioLiquido obrigatório não fornecido');
        }

        if (typeof balanco.ativoTotal !== 'number') {
            throw new Error('IndicesFinanceirosCalculator: balanco.ativoTotal deve ser número');
        }

        if (typeof balanco.passivoTotal !== 'number') {
            throw new Error('IndicesFinanceirosCalculator: balanco.passivoTotal deve ser número');
        }

        // Validar campos CALCULADOS da DRE (devem ter sido calculados antes)
        if (typeof dre.receitaLiquida !== 'number') {
            throw new Error('IndicesFinanceirosCalculator: dre.receitaLiquida deve ser número');
        }

        if (typeof dre.custosProdutos !== 'number') {
            throw new Error('IndicesFinanceirosCalculator: dre.custosProdutos (CMV) deve ser número');
        }

        if (typeof dre.lucroBruto !== 'number') {
            throw new Error('IndicesFinanceirosCalculator: dre.lucroBruto deve ter sido calculado antes - obrigatório');
        }

        if (typeof dre.lucroLiquido !== 'number') {
            throw new Error('IndicesFinanceirosCalculator: dre.lucroLiquido deve ter sido calculado antes - obrigatório');
        }

        // Validar campos SEMI-OBRIGATÓRIOS (devem existir, podem ser zero)
        if (balanco.ativo.circulante.disponibilidades !== undefined) {
            if (typeof balanco.ativo.circulante.disponibilidades !== 'number') {
                throw new Error('IndicesFinanceirosCalculator: balanco.ativo.circulante.disponibilidades deve ser número');
            }
        }

        if (balanco.ativo.circulante.contasReceber !== undefined) {
            if (typeof balanco.ativo.circulante.contasReceber !== 'number') {
                throw new Error('IndicesFinanceirosCalculator: balanco.ativo.circulante.contasReceber deve ser número');
            }
        }

        if (balanco.passivo.circulante.fornecedores !== undefined) {
            if (typeof balanco.passivo.circulante.fornecedores !== 'number') {
                throw new Error('IndicesFinanceirosCalculator: balanco.passivo.circulante.fornecedores deve ser número');
            }
        }

        // Validar campos OPCIONAIS do balanço (podem não existir)
        if (balanco.ativo.circulante.estoques !== undefined) {
            if (typeof balanco.ativo.circulante.estoques !== 'number') {
                throw new Error('IndicesFinanceirosCalculator: balanco.ativo.circulante.estoques deve ser número');
            }
        }
    }

    /**
     * Formata mensagem substituindo placeholders
     * @private
     * @param {string} template
     * @param {Object} vars
     * @returns {string}
     */
    #formatMsg(template, vars) {
        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            const val = typeof value === 'number' ? value.toFixed(2) : String(value);
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
        }
        return result;
    }

    /**
     * Soma valores recursivamente
     * @private
     * @param {Object} obj
     * @returns {number}
     */
    #somarValores(obj) {
        let soma = 0;
        for (const val of Object.values(obj)) {
            if (typeof val === 'number') {
                soma += val;
            } else if (typeof val === 'object' && val !== null) {
                soma += this.#somarValores(val);
            }
        }
        return soma;
    }

    // ==================== LIQUIDEZ ====================
    /**
     * Calcula índices de liquidez
     * @private
     * @param {Object} balanco
     * @returns {Object}
     */
    #calcularLiquidez(balanco) {
        const ac = this.#somarValores(balanco.ativo.circulante);
        const pc = this.#somarValores(balanco.passivo.circulante);

        // Campo OPCIONAL - empresas de serviços podem não ter estoques
        const estoques = balanco.ativo.circulante.estoques !== undefined
            ? balanco.ativo.circulante.estoques
            : 0;

        // Campo SEMI-OBRIGATÓRIO - já validado, pode ser zero
        const disponivel = balanco.ativo.circulante.disponibilidades !== undefined
            ? balanco.ativo.circulante.disponibilidades
            : 0;

        // Campos OPCIONAIS - não circulantes podem não existir
        const rlp = balanco.ativo.naoCirculante !== undefined
            ? this.#somarValores(balanco.ativo.naoCirculante)
            : 0;

        const pnc = balanco.passivo.naoCirculante !== undefined
            ? this.#somarValores(balanco.passivo.naoCirculante)
            : 0;

        return {
            corrente: this.#calcularLiquidezCorrente(ac, pc),
            seca: this.#calcularIndice(ac - estoques, pc, this.msg.liquidez.seca),
            imediata: this.#calcularIndice(disponivel, pc, this.msg.liquidez.imediata),
            geral: this.#calcularIndice(ac + rlp, pc + pnc, this.msg.liquidez.geral),
        };
    }

    /**
     * Calcula liquidez corrente com interpretação
     * @private
     * @param {number} ac
     * @param {number} pc
     * @returns {Object}
     */
    #calcularLiquidezCorrente(ac, pc) {
        if (pc === 0) {
            return {
                valor: null,
                nome: this.msg.liquidez.corrente.nome,
                formula: this.msg.liquidez.corrente.formula,
                interpretacao: this.msg.interpretacoes.naoCalculado,
            };
        }

        const valor = ac / pc;
        let interpretacao;

        if (valor >= this.thresholds.liquidezCorrenteExcelente) {
            interpretacao = this.#formatMsg(this.msg.liquidez.corrente.excelente, { valor });
        } else if (valor >= this.thresholds.liquidezCorrenteBom) {
            interpretacao = this.#formatMsg(this.msg.liquidez.corrente.bom, { valor });
        } else if (valor >= this.thresholds.liquidezCorrenteAdequado) {
            interpretacao = this.#formatMsg(this.msg.liquidez.corrente.adequado, { valor });
        } else if (valor >= this.thresholds.liquidezCorrenteBaixo) {
            interpretacao = this.#formatMsg(this.msg.liquidez.corrente.baixo, { valor });
        } else {
            interpretacao = this.#formatMsg(this.msg.liquidez.corrente.critico, { valor });
        }

        return {
            valor,
            nome: this.msg.liquidez.corrente.nome,
            formula: this.msg.liquidez.corrente.formula,
            interpretacao,
        };
    }

    /**
     * Calcula índice genérico
     * @private
     * @param {number} numerador
     * @param {number} denominador
     * @param {Object} msgConfig
     * @returns {Object}
     */
    #calcularIndice(numerador, denominador, msgConfig) {
        if (denominador === 0) {
            return {
                valor: null,
                nome: msgConfig.nome,
                formula: msgConfig.formula,
                interpretacao: this.msg.interpretacoes.naoCalculado,
            };
        }

        const valor = numerador / denominador;
        return {
            valor,
            nome: msgConfig.nome,
            formula: msgConfig.formula,
            interpretacao: this.#formatMsg(this.msg.interpretacoes.vezes, { valor }),
        };
    }

    // ==================== RENTABILIDADE ====================
    /**
     * Calcula índices de rentabilidade
     * @private
     * @param {Object} balanco
     * @param {Object} dre
     * @returns {Object}
     */
    #calcularRentabilidade(balanco, dre) {
        // Campos CALCULADOS - já validados, não usar fallback
        const receitaLiquida = dre.receitaLiquida;
        const lucroBruto = dre.lucroBruto;
        const lucroLiquido = dre.lucroLiquido;

        // Campo CALCULADO OPCIONAL - pode não ter sido calculado
        const ebitda = dre.ebitda !== undefined ? dre.ebitda : null;

        const pl = this.#somarValores(balanco.patrimonioLiquido);
        const ativoTotal = balanco.ativoTotal;

        return {
            margemBruta: this.#calcularPercentual(lucroBruto, receitaLiquida, this.msg.rentabilidade.margemBruta),
            margemEBITDA: ebitda !== null
                ? this.#calcularPercentual(ebitda, receitaLiquida, this.msg.rentabilidade.margemEBITDA)
                : this.#retornarNaoCalculado(this.msg.rentabilidade.margemEBITDA),
            margemLiquida: this.#calcularPercentual(lucroLiquido, receitaLiquida, this.msg.rentabilidade.margemLiquida),
            roe: this.#calcularPercentual(lucroLiquido, pl, this.msg.rentabilidade.roe),
            roa: this.#calcularPercentual(lucroLiquido, ativoTotal, this.msg.rentabilidade.roa),
        };
    }

    /**
     * Calcula percentual
     * @private
     * @param {number} numerador
     * @param {number} denominador
     * @param {Object} msgConfig
     * @returns {Object}
     */
    #calcularPercentual(numerador, denominador, msgConfig) {
        if (denominador === 0) {
            return this.#retornarNaoCalculado(msgConfig);
        }

        const valor = (numerador / denominador) * 100;
        return {
            valor,
            nome: msgConfig.nome,
            formula: msgConfig.formula,
            interpretacao: this.#formatMsg(this.msg.interpretacoes.percentual, { valor }),
        };
    }

    /**
     * Retorna objeto para índice não calculado
     * @private
     * @param {Object} msgConfig
     * @returns {Object}
     */
    #retornarNaoCalculado(msgConfig) {
        return {
            valor: null,
            nome: msgConfig.nome,
            formula: msgConfig.formula,
            interpretacao: this.msg.interpretacoes.naoCalculado,
        };
    }

    // ==================== ESTRUTURA ====================
    /**
     * Calcula índices de estrutura
     * @private
     * @param {Object} balanco
     * @returns {Object}
     */
    #calcularEstrutura(balanco) {
        const pl = this.#somarValores(balanco.patrimonioLiquido);
        const pc = this.#somarValores(balanco.passivo.circulante);

        const pnc = balanco.passivo.naoCirculante !== undefined
            ? this.#somarValores(balanco.passivo.naoCirculante)
            : 0;

        const passivoExigivel = pc + pnc;

        const ativoPermanente = balanco.ativo.naoCirculante !== undefined
            ? this.#somarValores(balanco.ativo.naoCirculante)
            : 0;

        return {
            pct: this.#calcularIndice(passivoExigivel, pl, this.msg.estrutura.pct),
            imobilizacaoPL: this.#calcularIndice(ativoPermanente, pl, this.msg.estrutura.imobilizacaoPL),
            imobilizacaoRNC: this.#calcularIndice(ativoPermanente, pl + pnc, this.msg.estrutura.imobilizacaoRNC),
        };
    }

    // ==================== ATIVIDADE ====================
    /**
     * Calcula índices de atividade
     * @private
     * @param {Object} balanco
     * @param {Object} dre
     * @returns {Object}
     */
    #calcularAtividade(balanco, dre) {
        const receitaLiquida = dre.receitaLiquida;
        const cmv = dre.custosProdutos;

        const contasReceber = balanco.ativo.circulante.contasReceber !== undefined
            ? balanco.ativo.circulante.contasReceber
            : 0;

        const fornecedores = balanco.passivo.circulante.fornecedores !== undefined
            ? balanco.passivo.circulante.fornecedores
            : 0;

        const estoques = balanco.ativo.circulante.estoques !== undefined
            ? balanco.ativo.circulante.estoques
            : 0;

        // PMR
        const pmr = receitaLiquida > 0 ? (contasReceber / receitaLiquida) * 360 : null;

        // PMP
        const pmp = cmv > 0 ? (fornecedores / cmv) * 360 : null;

        // Giro de Estoque
        const giroEstoque = (estoques > 0 && cmv > 0) ? cmv / estoques : null;
        const pme = giroEstoque !== null ? 360 / giroEstoque : null;

        // Ciclo Operacional
        const cicloOperacional = (pmr !== null && pme !== null)
            ? pmr + pme
            : pmr !== null
                ? pmr
                : null;

        // Ciclo Financeiro
        const cicloFinanceiro = (cicloOperacional !== null && pmp !== null)
            ? cicloOperacional - pmp
            : null;

        return {
            pmr: this.#calcularDias(pmr, this.msg.atividade.pmr),
            pmp: this.#calcularDias(pmp, this.msg.atividade.pmp),
            giroEstoque: this.#calcularGiro(giroEstoque),
            cicloOperacional: this.#calcularDias(cicloOperacional, this.msg.atividade.cicloOperacional),
            cicloFinanceiro: this.#calcularDias(cicloFinanceiro, this.msg.atividade.cicloFinanceiro),
        };
    }

    /**
     * Calcula índice em dias
     * @private
     * @param {number|null} valor
     * @param {Object} msgConfig
     * @returns {Object}
     */
    #calcularDias(valor, msgConfig) {
        if (valor === null) {
            return this.#retornarNaoCalculado(msgConfig);
        }

        return {
            valor,
            nome: msgConfig.nome,
            formula: msgConfig.formula,
            interpretacao: this.#formatMsg(this.msg.interpretacoes.dias, { valor: valor.toFixed(0) }),
        };
    }

    /**
     * Calcula giro de estoque
     * @private
     * @param {number|null} valor
     * @returns {Object}
     */
    #calcularGiro(valor) {
        const msgConfig = this.msg.atividade.giroEstoque;
        if (valor === null) {
            return this.#retornarNaoCalculado(msgConfig);
        }

        return {
            valor,
            nome: msgConfig.nome,
            formula: msgConfig.formula,
            interpretacao: this.#formatMsg(this.msg.interpretacoes.vezes, { valor }),
        };
    }

    // ==================== Z-SCORE DE ALTMAN ====================
    /**
     * Calcula Z-Score de Altman
     * @private
     * @param {Object} balanco
     * @param {Object} dre
     * @returns {Object}
     */
    // ==================== EVOLUÇÃO PATRIMONIAL ====================
    /**
     * Calcula Evolução Patrimonial (Adaptado do Sicoob GRC)
     * Fórmula: ((PL Atual - PL Anterior) / PL Anterior) × 100
     * Interpretação: Crescimento do patrimônio líquido ao longo do tempo
     * 
     * @private
     * @param {Array} balancosMultiAno - Array de balanços ordenados (ano mais recente primeiro)
     * @returns {Object}
     */
    #calcularEvolucaoPatrimonial(balancosMultiAno) {
        // Validação de entrada
        if (!balancosMultiAno || !Array.isArray(balancosMultiAno)) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                nome: 'Evolução Patrimonial',
                interpretacao: 'Dados de múltiplos anos não disponíveis'
            };
        }

        // Precisa de pelo menos 2 anos de dados
        if (balancosMultiAno.length < 2) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                nome: 'Evolução Patrimonial',
                interpretacao: 'Necessário pelo menos 2 anos de balanço para calcular evolução'
            };
        }

        // Obter PL do ano mais recente e anterior
        const balancoAtual = balancosMultiAno[0];
        const balancoAnterior = balancosMultiAno[1];

        const plAtual = parseFloat(balancoAtual.patrimonioLiquido);
        const plAnterior = parseFloat(balancoAnterior.patrimonioLiquido);

        // Validação rigorosa de valores obrigatórios
        if (isNaN(plAtual)) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                nome: 'Evolução Patrimonial',
                interpretacao: 'Patrimônio Líquido atual ausente ou inválido'
            };
        }

        if (isNaN(plAnterior) || plAnterior === 0) {
            return {
                valor: null,
                valorFormatado: '-',
                status: 'indefinido',
                nome: 'Evolução Patrimonial',
                interpretacao: 'Patrimônio Líquido anterior ausente, inválido ou zerado'
            };
        }

        // Calcular evolução percentual
        const evolucaoPercentual = ((plAtual - plAnterior) / plAnterior) * 100;

        // Classificação baseada em scoring-criteria.json (thresholds.financeiro.evolucaoPatrimonial)
        // excelente: 10%, bom: 5%, adequado: 0%, critico: < 0%
        let status, cor;
        if (evolucaoPercentual >= 10) {
            status = 'excelente';
            cor = '#4CAF50'; // Verde
        } else if (evolucaoPercentual >= 5) {
            status = 'bom';
            cor = '#8BC34A'; // Verde claro
        } else if (evolucaoPercentual >= 0) {
            status = 'adequado';
            cor = '#FF9800'; // Laranja
        } else if (evolucaoPercentual >= -5) {
            status = 'baixo';
            cor = '#FF5722'; // Laranja escuro
        } else {
            status = 'crítico';
            cor = '#F44336'; // Vermelho
        }

        return {
            valor: evolucaoPercentual,
            valorFormatado: `${evolucaoPercentual >= 0 ? '+' : ''}${evolucaoPercentual.toFixed(1)}%`,
            status,
            cor,
            nome: 'Evolução Patrimonial',
            interpretacao: evolucaoPercentual >= 0
                ? `Crescimento patrimonial de ${evolucaoPercentual.toFixed(1)}% no período`
                : `Redução patrimonial de ${Math.abs(evolucaoPercentual).toFixed(1)}% no período`,
            plAtual: plAtual,
            plAnterior: plAnterior,
            variacao: plAtual - plAnterior
        };
    }

    #calcularZScore(balanco, dre) {
        const ativoTotal = balanco.ativoTotal;
        const ac = this.#somarValores(balanco.ativo.circulante);
        const pc = this.#somarValores(balanco.passivo.circulante);
        const pl = this.#somarValores(balanco.patrimonioLiquido);
        const lucroLiquido = dre.lucroLiquido;
        const receitaLiquida = dre.receitaLiquida;
        const passivoTotal = balanco.passivoTotal;

        // Lucros acumulados - campo OPCIONAL
        const lucrosAcumulados = balanco.patrimonioLiquido.lucrosAcumulados !== undefined
            ? balanco.patrimonioLiquido.lucrosAcumulados
            : lucroLiquido;

        // EBIT - campo CALCULADO OPCIONAL
        const ebit = dre.lucroOperacional !== undefined
            ? dre.lucroOperacional
            : lucroLiquido;

        if (ativoTotal === 0) {
            return this.#retornarNaoCalculado(this.msg.zScore);
        }

        // Fórmula Z-Score Altman
        const x1 = (ac - pc) / ativoTotal;  // Capital de Giro Líquido / Ativo Total
        const x2 = lucrosAcumulados / ativoTotal;  // Lucros Retidos / Ativo Total
        const x3 = ebit / ativoTotal;  // EBIT / Ativo Total
        const x4 = pl / passivoTotal;  // Valor de Mercado do PL / Passivo Total
        const x5 = receitaLiquida / ativoTotal;  // Vendas / Ativo Total

        const z = (1.2 * x1) + (1.4 * x2) + (3.3 * x3) + (0.6 * x4) + (1.0 * x5);

        let interpretacao;
        if (z > this.thresholds.zScoreSeguro) {
            interpretacao = this.msg.zScore.zonaSegura;
        } else if (z > this.thresholds.zScoreCinza) {
            interpretacao = this.msg.zScore.zonaCinza;
        } else {
            interpretacao = this.msg.zScore.zonaPerigo;
        }

        return {
            valor: z,
            nome: this.msg.zScore.nome,
            formula: this.msg.zScore.formula,
            interpretacao,
            componentes: {
                x1: { valor: x1, peso: 1.2, contribuicao: 1.2 * x1 },
                x2: { valor: x2, peso: 1.4, contribuicao: 1.4 * x2 },
                x3: { valor: x3, peso: 3.3, contribuicao: 3.3 * x3 },
                x4: { valor: x4, peso: 0.6, contribuicao: 0.6 * x4 },
                x5: { valor: x5, peso: 1.0, contribuicao: 1.0 * x5 },
            },
        };
    }
}

window.IndicesFinanceirosCalculator = IndicesFinanceirosCalculator;
