/**
 * ScoringEngine - Motor de Scoring de Crédito
 *
 * Motor proprietário de classificação de risco baseado em análise multifatorial ponderada.
 * Avalia 5 categorias (100 pontos total) e classifica em 8 ratings (AAA a D).
 *
 * PRINCÍPIOS:
 * - NO FALLBACKS: Validação explícita, erros claros
 * - NO HARDCODED DATA: Mensagens de messages.json, critérios de scoring-criteria.json
 * - KISS & DRY: Código simples e não duplicado
 *
 * @version 1.0.0
 * @author CreditScore Pro
 */

export class ScoringEngine {
    /**
     * @param {Object} config - Configuração do sistema (config/creditscore-config.json)
     * @param {Object} messages - Mensagens do sistema (config/messages.json)
     * @param {Object} criteria - Critérios de pontuação (config/scoring-criteria.json)
     */
    constructor(config, messages, criteria) {
        if (!config) {
            throw new Error('ScoringEngine: config obrigatória - não fornecida');
        }
        if (!messages) {
            throw new Error('ScoringEngine: messages obrigatórias - não fornecidas');
        }
        if (!criteria) {
            throw new Error('ScoringEngine: criteria obrigatório - não fornecido');
        }
        if (!config.scoring) {
            throw new Error('ScoringEngine: config.scoring obrigatório - não encontrado');
        }
        if (!messages.calculators || !messages.calculators.scoringEngine) {
            throw new Error('ScoringEngine: messages.calculators.scoringEngine obrigatório - não encontrado');
        }

        this.config = config.scoring;
        this.msg = messages.calculators.scoringEngine;
        this.criteria = criteria;
        this.thresholds = criteria.thresholds;
        this.pontuacao = criteria.pontuacao;
        this.defaults = criteria.defaults;
    }

    /**
     * Método de inicialização
     * @returns {Promise<boolean>}
     */
    async init() {
        console.log(this.msg.mensagens.calculoIniciado);
        return true;
    }

    /**
     * Calcula o scoring completo de crédito
     * @param {Object} data - Dados completos para cálculo
     * @returns {Object} Resultado do scoring
     */
    async calcularScoring(data) {
        // Validar dados de entrada
        this.#validarDados(data);

        // Calcular pontuação de cada categoria
        const cadastral = this.#avaliarCadastral(data.cadastro, data.compliance);
        const financeiro = this.#avaliarFinanceiro(data.demonstracoes, data.indices, data.ultimoPeriodo);
        const capacidadePagamento = this.#avaliarCapacidadePagamento(data.indices, data.capitalGiro);
        const endividamento = this.#avaliarEndividamento(data.endividamento, data.demonstracoes);
        
        // NOVA CATEGORIA: Estrutura e Concentração (substitui antiga "garantias")
        const estruturaConcentracao = this.#avaliarEstrutura({
            concentracao: data.concentracao,
            ciclos: data.ciclos,
            garantias: data.garantias,
            relacionamento: data.relacionamento
        });

        // Calcular pontuação total (0-100)
        // Cadastral: 20 + Financeiro: 22 + CapPag: 23 + Endividamento: 20 + Estrutura: 15 = 100
        const pontuacaoTotal = Math.round(
            cadastral.pontuacao +
            financeiro.pontuacao +
            capacidadePagamento.pontuacao +
            endividamento.pontuacao +
            estruturaConcentracao.pontuacao
        );

        // Determinar classificação de risco (AAA a D)
        const classificacao = this.#determinarClassificacao(pontuacaoTotal);

        // Gerar alertas
        const alertas = this.#gerarAlertas(pontuacaoTotal, {
            cadastral,
            financeiro,
            capacidadePagamento,
            endividamento,
            estruturaConcentracao
        });

        // Gerar recomendações
        const recomendacoes = this.#gerarRecomendacoes({
            cadastral,
            financeiro,
            capacidadePagamento,
            endividamento,
            estruturaConcentracao
        });

        return {
            pontuacaoTotal,
            classificacao,
            categorias: {
                cadastral,
                financeiro,
                capacidadePagamento,
                endividamento,
                estruturaConcentracao
            },
            alertas,
            recomendacoes,
            mensagemFinal: this.#formatMsg(this.msg.mensagens.calculoConcluido, {
                rating: classificacao.rating,
                pontos: pontuacaoTotal
            }),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Valida dados de entrada
     * @private
     */
    #validarDados(data) {
        if (!data) {
            throw new Error('ScoringEngine: dados não fornecidos - obrigatório');
        }

        // Validar dados OBRIGATÓRIOS
        if (!data.cadastro || typeof data.cadastro !== 'object') {
            throw new Error('ScoringEngine: data.cadastro obrigatório e deve ser objeto');
        }
        if (!data.demonstracoes || typeof data.demonstracoes !== 'object') {
            throw new Error('ScoringEngine: data.demonstracoes obrigatório e deve ser objeto');
        }
        if (!data.endividamento || typeof data.endividamento !== 'object') {
            throw new Error('ScoringEngine: data.endividamento obrigatório e deve ser objeto');
        }

        // Validar dados OPCIONAIS (podem não existir mas se existirem devem ser objetos)
        if (data.compliance !== undefined && typeof data.compliance !== 'object') {
            throw new Error('ScoringEngine: data.compliance deve ser objeto se fornecido');
        }
        if (data.indices !== undefined && typeof data.indices !== 'object') {
            throw new Error('ScoringEngine: data.indices deve ser objeto se fornecido');
        }
        if (data.capitalGiro !== undefined && typeof data.capitalGiro !== 'object') {
            throw new Error('ScoringEngine: data.capitalGiro deve ser objeto se fornecido');
        }
        if (data.garantias !== undefined && typeof data.garantias !== 'object') {
            throw new Error('ScoringEngine: data.garantias deve ser objeto se fornecido');
        }
        if (data.relacionamento !== undefined && typeof data.relacionamento !== 'object') {
            throw new Error('ScoringEngine: data.relacionamento deve ser objeto se fornecido');
        }
    }

    /**
     * Avalia categoria Cadastral (20 pontos)
     * @private
     */
    #avaliarCadastral(cadastro, compliance) {
        const peso = this.config.categorias.cadastral.peso;
        const msgCategoria = this.msg.categorias.cadastral;

        let pontos = 0;
        const criterios = {};

        // Critério 1: Regularidade Fiscal
        const regularidadeFiscal = this.#avaliarRegularidadeFiscal(compliance);
        criterios.regularidadeFiscal = regularidadeFiscal;
        pontos += regularidadeFiscal.pontos;

        // Critério 2: Tempo de Atividade
        const tempoAtividade = this.#avaliarTempoAtividade(cadastro);
        criterios.tempoAtividade = tempoAtividade;
        pontos += tempoAtividade.pontos;

        // Critério 3: Histórico de Protestos
        const historicoProtestos = this.#avaliarHistoricoProtestos(compliance);
        criterios.historicoProtestos = historicoProtestos;
        pontos += historicoProtestos.pontos;

        // Critério 4: Situação dos Sócios
        const situacaoSocios = this.#avaliarSituacaoSocios(cadastro, compliance);
        criterios.situacaoSocios = situacaoSocios;
        pontos += situacaoSocios.pontos;

        return {
            nome: msgCategoria.nome,
            peso,
            pontuacao: Math.min(pontos, peso),
            criterios
        };
    }

    /**
     * Avalia categoria Financeiro (25 pontos)
     * @private
     */
    #avaliarFinanceiro(demonstracoes, indices, ultimoPeriodo) {
        const peso = 22; // Atualizado de 25 para 22 conforme novo scoring
        const msgCategoria = this.msg.categorias.financeiro;

        let pontos = 0;
        const criterios = {};

        // Critério 1: Evolução do Faturamento (6 pts)
        const evolucaoFaturamento = this.#avaliarEvolucaoFaturamento(demonstracoes);
        criterios.evolucaoFaturamento = evolucaoFaturamento;
        pontos += evolucaoFaturamento.pontos;

        // Critério 2: Margens (6 pts) - consolidado de evolucaoLucratividade
        const evolucaoLucratividade = this.#avaliarEvolucaoLucratividade(ultimoPeriodo.dre);
        criterios.margens = evolucaoLucratividade;
        pontos += evolucaoLucratividade.pontos;

        // Critério 3: ROE/ROA (5 pts) - consolidado de qualidadeDemonstracoes
        const qualidadeDemonstracoes = this.#avaliarQualidadeDemonstracoes(ultimoPeriodo);
        criterios.roeRoa = qualidadeDemonstracoes;
        pontos += qualidadeDemonstracoes.pontos;

        // Critério 4: Evolução Patrimonial (5 pts) - NOVO
        const evolucaoPatrimonial = this.#avaliarEvolucaoPatrimonial(demonstracoes);
        criterios.evolucaoPatrimonial = evolucaoPatrimonial;
        pontos += evolucaoPatrimonial.pontos;

        return {
            nome: msgCategoria.nome,
            peso,
            pontuacao: Math.min(pontos, peso),
            criterios
        };
    }

    /**
     * Avalia categoria Capacidade de Pagamento (25 pontos)
     * @private
     */
    #avaliarCapacidadePagamento(indices, capitalGiro) {
        const peso = this.config.categorias.capacidadePagamento.peso;
        const msgCategoria = this.msg.categorias.capacidadePagamento;

        let pontos = 0;
        const criterios = {};

        // Critério 1: Liquidez Corrente
        const liquidezCorrente = this.#avaliarLiquidezCorrente(indices);
        criterios.liquidezCorrente = liquidezCorrente;
        pontos += liquidezCorrente.pontos;

        // Critério 2: Cobertura de Juros
        const coberturaJuros = this.#avaliarCoberturaJuros(indices);
        criterios.coberturaJuros = coberturaJuros;
        pontos += coberturaJuros.pontos;

        // Critério 3: Geração de Caixa
        const geracaoCaixa = this.#avaliarGeracaoCaixa(indices);
        criterios.geracaoCaixa = geracaoCaixa;
        pontos += geracaoCaixa.pontos;

        // Critério 4: Capital de Giro
        const capitalGiroAvaliacao = this.#avaliarCapitalGiro(capitalGiro);
        criterios.capitalGiro = capitalGiroAvaliacao;
        pontos += capitalGiroAvaliacao.pontos;

        return {
            nome: msgCategoria.nome,
            peso,
            pontuacao: Math.min(pontos, peso),
            criterios
        };
    }

    /**
     * Avalia categoria Endividamento (20 pontos)
     * @private
     */
    #avaliarEndividamento(endividamento, ultimoPeriodo) {
        const peso = 20; // Mantido em 20 pontos
        const msgCategoria = this.msg.categorias.endividamento;

        let pontos = 0;
        const criterios = {};

        // Critério 1: Nível de Endividamento (6 pts - antes 6.67)
        const nivelEndividamento = this.#avaliarNivelEndividamento(ultimoPeriodo);
        criterios.nivelEndividamento = nivelEndividamento;
        pontos += nivelEndividamento.pontos;

        // Critério 2: Composição do Endividamento (4 pts - antes 6.67)
        const composicaoEndividamento = this.#avaliarComposicaoEndividamento(ultimoPeriodo);
        criterios.composicaoEndividamento = composicaoEndividamento;
        pontos += composicaoEndividamento.pontos;

        // Critério 3: Inadimplência Histórica (5 pts) - NOVO
        const inadimplenciaHistorica = this.#avaliarInadimplenciaHistorica(endividamento.inadimplencia);
        criterios.inadimplenciaHistorica = inadimplenciaHistorica;
        pontos += inadimplenciaHistorica.pontos;

        // Critério 4: Histórico de Pagamentos (5 pts - antes 6.66)
        const historicoPagamentos = this.#avaliarHistoricoPagamentos(endividamento);
        criterios.historicoPagamentos = historicoPagamentos;
        pontos += historicoPagamentos.pontos;

        return {
            nome: msgCategoria.nome,
            peso,
            pontuacao: Math.min(pontos, peso),
            criterios
        };
    }

    /**
     * Avalia categoria Garantias e Relacionamento (10 pontos)
     * @private
     */
    #avaliarGarantias(garantias, relacionamento) {
        const peso = this.config.categorias.garantias.peso;
        const msgCategoria = this.msg.categorias.garantias;

        let pontos = 0;
        const criterios = {};

        // Critério 1: Garantias Disponíveis
        const garantiasDisponiveis = this.#avaliarGarantiasDisponiveis(garantias);
        criterios.garantiasDisponiveis = garantiasDisponiveis;
        pontos += garantiasDisponiveis.pontos;

        // Critério 2: Tempo de Relacionamento
        const tempoRelacionamento = this.#avaliarTempoRelacionamento(relacionamento);
        criterios.tempoRelacionamento = tempoRelacionamento;
        pontos += tempoRelacionamento.pontos;

        // Critério 3: Operações Anteriores
        const operacoesAnteriores = this.#avaliarOperacoesAnteriores(relacionamento);
        criterios.operacoesAnteriores = operacoesAnteriores;
        pontos += operacoesAnteriores.pontos;

        return {
            nome: msgCategoria.nome,
            peso,
            pontuacao: Math.min(pontos, peso),
            criterios
        };
    }

    // ========================================
    // MÉTODOS DE AVALIAÇÃO DE CRITÉRIOS
    // ========================================

    /**
     * Avalia Regularidade Fiscal
     * @private
     */
    #avaliarRegularidadeFiscal(compliance) {
        const msgCriterio = this.msg.categorias.cadastral.criterios.regularidadeFiscal;
        const pontosPossiveis = this.pontuacao.categorias.cadastral.regularidadeFiscal;

        // Se não houver dados de compliance, pontuar como adequado
        if (!compliance || !compliance.certidoes) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.regularidadeFiscal,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const certidoes = compliance.certidoes;
        let validas = 0;
        let pendencias = 0;
        let problemas = 0;

        for (const [tipo, status] of Object.entries(certidoes)) {
            if (status === 'negativa' || status === 'valida') {
                validas++;
            } else if (status === 'pendente' || status === 'administrativa') {
                pendencias++;
            } else {
                problemas++;
            }
        }

        const total = validas + pendencias + problemas;
        if (total === 0) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.regularidadeFiscal,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const percentualValidas = validas / total;
        const thresholds = this.thresholds.cadastral.certidoes;

        if (percentualValidas === thresholds.percentualExcelente) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (percentualValidas >= thresholds.percentualBom && pendencias > 0 && problemas === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (percentualValidas >= thresholds.percentualAdequado && problemas <= 1) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (problemas <= thresholds.problemasMaximoBaixo) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Tempo de Atividade
     * @private
     */
    #avaliarTempoAtividade(cadastro) {
        const msgCriterio = this.msg.categorias.cadastral.criterios.tempoAtividade;
        const pontosPossiveis = this.pontuacao.categorias.cadastral.tempoAtividade;

        if (!cadastro.dataConstituicao) {
            throw new Error('ScoringEngine: cadastro.dataConstituicao obrigatório para avaliar tempo de atividade');
        }

        const dataConstituicao = new Date(cadastro.dataConstituicao);
        const hoje = new Date();
        const diffMs = hoje - dataConstituicao;
        const anos = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        const meses = Math.round((anos % 1) * 12);

        const thresholds = this.thresholds.cadastral.tempoAtividade;

        if (anos >= thresholds.excelente) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis,
                nivel: 'excelente',
                avaliacao: this.#formatMsg(msgCriterio.excelente, { anos: Math.floor(anos) })
            };
        } else if (anos >= thresholds.bom) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.bom,
                nivel: 'bom',
                avaliacao: this.#formatMsg(msgCriterio.bom, { anos: Math.floor(anos) })
            };
        } else if (anos >= thresholds.adequado) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.adequado,
                nivel: 'adequado',
                avaliacao: this.#formatMsg(msgCriterio.adequado, { anos: Math.floor(anos) })
            };
        } else if (anos >= thresholds.baixo) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.baixo,
                nivel: 'baixo',
                avaliacao: this.#formatMsg(msgCriterio.baixo, { anos: Math.floor(anos) })
            };
        } else {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.critico,
                nivel: 'critico',
                avaliacao: this.#formatMsg(msgCriterio.critico, { meses })
            };
        }
    }

    /**
     * Avalia Histórico de Protestos
     * @private
     */
    #avaliarHistoricoProtestos(compliance) {
        const msgCriterio = this.msg.categorias.cadastral.criterios.historicoProtestos;
        const pontosPossiveis = this.pontuacao.categorias.cadastral.historicoProtestos;

        // Se não houver dados de compliance, pontuar como adequado
        if (!compliance || !compliance.protestos) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.protestos,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const protestos = compliance.protestos;

        if (!protestos || protestos.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        }

        const abertos = protestos.filter(p => p.status === 'aberto' || p.status === 'pendente');
        const quitados = protestos.filter(p => p.status === 'quitado');
        const valorAberto = abertos.reduce((sum, p) => sum + (p.valor !== undefined ? p.valor : 0), 0);

        const limiar = this.thresholds.cadastral.protestoLimiar;
        const multiplicadores = this.defaults.multiplicadoresProtesto;

        if (abertos.length === 0 && quitados.length > 0 && valorAberto < limiar * multiplicadores.limiarBaixo) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.bom,
                nivel: 'bom',
                avaliacao: this.#formatMsg(msgCriterio.bom, { limiar })
            };
        } else if (abertos.length === 0 && quitados.length > 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (abertos.length <= 2 && valorAberto < limiar * multiplicadores.limiarAlto) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Situação dos Sócios
     * @private
     */
    #avaliarSituacaoSocios(cadastro, compliance) {
        const msgCriterio = this.msg.categorias.cadastral.criterios.situacaoSocios;
        const pontosPossiveis = this.pontuacao.categorias.cadastral.situacaoSocios;

        // Se não houver dados de sócios, pontuar como adequado
        if (!cadastro.composicaoSocietaria || cadastro.composicaoSocietaria.length === 0) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.socios,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        // Se não houver dados de compliance dos sócios, pontuar como bom
        if (!compliance || !compliance.socios) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.sociosCompliance,
                nivel: 'bom',
                avaliacao: msgCriterio.bom
            };
        }

        const socios = compliance.socios;
        let semRestricoes = 0;
        let restricoesLeves = 0;
        let restricoesGraves = 0;

        for (const socio of socios) {
            if (!socio.restricoes || socio.restricoes.length === 0) {
                semRestricoes++;
            } else {
                const temGrave = socio.restricoes.some(r =>
                    r.tipo === 'falencia' || r.tipo === 'fraude' || r.gravidade === 'alta'
                );
                if (temGrave) {
                    restricoesGraves++;
                } else {
                    restricoesLeves++;
                }
            }
        }

        const total = semRestricoes + restricoesLeves + restricoesGraves;
        if (total === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        }

        const limiteRestricoes = this.thresholds.cadastral.socios.restricoesLevesMaximo;

        if (restricoesGraves > 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        } else if (restricoesLeves > total * limiteRestricoes) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else if (restricoesLeves > 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (semRestricoes === total) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        }
    }

    /**
     * Avalia Evolução do Faturamento
     * @private
     */
    #avaliarEvolucaoFaturamento(demonstracoes) {
        const msgCriterio = this.msg.categorias.financeiro.criterios.evolucaoFaturamento;
        const pontosPossiveis = this.pontuacao.categorias.financeiro.evolucaoFaturamento;

        const dres = demonstracoes?.dre ? Object.values(demonstracoes.dre) : [];

        if (dres.length < 2) {
            throw new Error('ScoringEngine: necessário pelo menos 2 períodos de DRE para avaliar evolução de faturamento');
        }

        // A estrutura já vem ordenada p1, p2, p3, p4
        const receitaInicial = dres[0].receitaLiquida;
        const receitaFinal = dres[dres.length - 1].receitaLiquida;
        const anos = dres.length - 1;

        if (receitaInicial === 0) {
            throw new Error('ScoringEngine: receita inicial não pode ser zero para calcular crescimento');
        }

        const cagr = Math.pow(receitaFinal / receitaInicial, 1 / anos) - 1;
        const crescimentoPercentual = (cagr * 100).toFixed(2);
        const thresholds = this.thresholds.financeiro.crescimentoFaturamento;

        if (cagr > thresholds.excelente) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis,
                nivel: 'excelente',
                avaliacao: this.#formatMsg(msgCriterio.excelente, { crescimento: crescimentoPercentual })
            };
        } else if (cagr > thresholds.bom) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.bom,
                nivel: 'bom',
                avaliacao: this.#formatMsg(msgCriterio.bom, { crescimento: crescimentoPercentual })
            };
        } else if (cagr >= thresholds.adequado) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.adequado,
                nivel: 'adequado',
                avaliacao: this.#formatMsg(msgCriterio.adequado, { crescimento: crescimentoPercentual })
            };
        } else if (cagr > thresholds.baixo) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.baixo,
                nivel: 'baixo',
                avaliacao: this.#formatMsg(msgCriterio.baixo, { crescimento: crescimentoPercentual })
            };
        } else {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.critico,
                nivel: 'critico',
                avaliacao: this.#formatMsg(msgCriterio.critico, { crescimento: crescimentoPercentual })
            };
        }
    }

    /**
     * Avalia Evolução da Lucratividade
     * @private
     */
    #avaliarEvolucaoLucratividade(dre) {
        const msgCriterio = this.msg.categorias.financeiro.criterios.evolucaoLucratividade;
        const pontosPossiveis = this.pontuacao.categorias.financeiro.evolucaoLucratividade;

        if (!dre || typeof dre.lucroLiquido !== 'number' || typeof dre.receitaLiquida !== 'number' || dre.receitaLiquida === 0) {
            return { nome: msgCriterio.nome, pontos: 0, nivel: 'critico', avaliacao: 'Dados insuficientes para margem.' };
        }

        const margemLiquida = (dre.lucroLiquido / dre.receitaLiquida) * 100;
        const margemPercentual = margemLiquida.toFixed(2);
        const thresholds = this.thresholds.financeiro.margemLiquida;

        if (margemLiquida > thresholds.excelente * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis,
                nivel: 'excelente',
                avaliacao: this.#formatMsg(msgCriterio.excelente, { margem: margemPercentual.toString() })
            };
        } else if (margemLiquida > thresholds.bom) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.bom,
                nivel: 'bom',
                avaliacao: this.#formatMsg(msgCriterio.bom, { margem: margemPercentual.toString() })
            };
        } else if (margemLiquida > thresholds.adequado) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.adequado,
                nivel: 'adequado',
                avaliacao: this.#formatMsg(msgCriterio.adequado, { margem: margemPercentual.toString() })
            };
        } else if (margemLiquida >= thresholds.baixo) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.baixo,
                nivel: 'baixo',
                avaliacao: this.#formatMsg(msgCriterio.baixo, { margem: margemPercentual.toString() })
            };
        } else {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.critico,
                nivel: 'critico',
                avaliacao: this.#formatMsg(msgCriterio.critico, { margem: margemPercentual.toString() })
            };
        }
    }

    /**
     * Avalia Evolução Patrimonial (NOVO - Adaptado Sicoob GRC)
     * Critério: Crescimento do PL ao longo do tempo
     * Pontuação: 5 pontos (integrado à categoria Financeiro)
     * @private
     * @param {Object} demonstracoes - Demonstrações financeiras multi-ano
     * @returns {Object}
     */
    #avaliarEvolucaoPatrimonial(demonstracoes) {
        const pontosPossiveis = this.pontuacao.categorias.financeiro.evolucaoPatrimonial;
        const thresholds = this.thresholds.financeiro.evolucaoPatrimonial;

        // Validação: necessário múltiplos anos
        if (!demonstracoes || !Array.isArray(demonstracoes) || demonstracoes.length < 2) {
            return {
                pontos: this.defaults.pontuacaoSemDados.evolucaoPatrimonial ?? pontosPossiveis * 0.6,
                nivel: 'adequado',
                valor: null,
                observacao: 'Dados de múltiplos anos não disponíveis'
            };
        }

        // Obter PL do ano mais recente e anterior
        const balancoAtual = balancos[balancos.length - 1];
        const balancoAnterior = balancos[0];

        if (!balancoAtual || !balancoAnterior) {
            return {
                pontos: this.defaults.pontuacaoSemDados.evolucaoPatrimonial ?? pontosPossiveis * 0.6,
                nivel: 'adequado',
                valor: null,
                observacao: 'Balanço patrimonial incompleto'
            };
        }

        const plAtual = parseFloat(balancoAtual.patrimonioLiquido);
        const plAnterior = parseFloat(balancoAnterior.patrimonioLiquido);

        // Validação rigorosa
        if (isNaN(plAtual) || isNaN(plAnterior) || plAnterior === 0) {
            return {
                pontos: this.defaults.pontuacaoSemDados.evolucaoPatrimonial ?? pontosPossiveis * 0.6,
                nivel: 'adequado',
                valor: null,
                observacao: 'Patrimônio Líquido ausente ou inválido'
            };
        }

        // Calcular evolução percentual
        const evolucao = ((plAtual - plAnterior) / plAnterior);

        // Classificar baseado em thresholds
        let nivel, pontos;
        if (evolucao >= thresholds.excelente) {
            nivel = 'excelente';
            pontos = pontosPossiveis * this.pontuacao.niveis.excelente;
        } else if (evolucao >= thresholds.bom) {
            nivel = 'bom';
            pontos = pontosPossiveis * this.pontuacao.niveis.bom;
        } else if (evolucao >= thresholds.adequado) {
            nivel = 'adequado';
            pontos = pontosPossiveis * this.pontuacao.niveis.adequado;
        } else if (evolucao > thresholds.critico) {
            nivel = 'baixo';
            pontos = pontosPossiveis * this.pontuacao.niveis.baixo;
        } else {
            nivel = 'crítico';
            pontos = pontosPossiveis * this.pontuacao.niveis.critico;
        }

        return {
            pontos,
            nivel,
            valor: evolucao,
            evolucaoPercentual: (evolucao * 100).toFixed(1),
            plAtual,
            plAnterior,
            observacao: evolucao >= 0 
                ? `Crescimento patrimonial de ${(evolucao * 100).toFixed(1)}%`
                : `Redução patrimonial de ${Math.abs(evolucao * 100).toFixed(1)}%`
        };
    }

    /**
     * Avalia Qualidade das Demonstrações
     * @private
     */
    #avaliarQualidadeDemonstracoes(ultimoPeriodo) {
        const msgCriterio = this.msg.categorias.financeiro.criterios.qualidadeDemonstracoes;
        const pontosPossiveis = this.pontuacao.categorias.financeiro.qualidadeDemonstracoes;

        const temAuditoria = ultimoPeriodo.auditoria !== undefined && ultimoPeriodo.auditoria === true;
        const temContadorCRC = ultimoPeriodo.contadorCRC !== undefined && ultimoPeriodo.contadorCRC !== '';
        const demonstracoesCompletas = ultimoPeriodo.balanco !== undefined && ultimoPeriodo.dre !== undefined;

        if (temAuditoria) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (temContadorCRC) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (demonstracoesCompletas) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else {
            const camposFaltando = [];
            if (!ultimoPeriodo.balanco) camposFaltando.push('balanco');
            if (!ultimoPeriodo.dre) camposFaltando.push('dre');

            const maxCamposBaixo = this.thresholds.financeiro.demonstracoes.camposFaltandoMaximoBaixo;

            if (camposFaltando.length <= maxCamposBaixo) {
                return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
            } else {
                return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
            }
        }
    }

    /**
     * Avalia Consistência dos Dados
     * @private
     */
    #avaliarConsistenciaDados(demonstracoes) {
        const msgCriterio = this.msg.categorias.financeiro.criterios.consistenciaDados;
        const pontosPossiveis = this.pontuacao.categorias.financeiro.consistenciaDados;

        if (!demonstracoes.balanco?.periodos || demonstracoes.balanco.periodos.length === 0) {
            throw new Error('ScoringEngine: demonstracoes.balanco.periodos obrigatório para avaliar consistência');
        }

        let inconsistenciasGraves = 0;
        let inconsistenciasRelevantes = 0;
        let inconsistenciasLeves = 0;
        let anosSemInconsistencia = 0;

        for (const balanco of demonstracoes.balanco.periodos) {
            const ativo = balanco.ativoTotal;
            const passivo = balanco.passivoTotal;
            const pl = this.#somarValores(balanco.patrimonioLiquido);
            const passivoMaisPL = passivo + pl;

            if (ativo === 0) {
                inconsistenciasGraves++;
                continue;
            }

            const diferenca = Math.abs(ativo - passivoMaisPL);
            const percentual = diferenca / ativo;
            const thresholds = this.thresholds.financeiro.inconsistenciaToleravel;

            if (percentual > thresholds.baixo) {
                inconsistenciasGraves++;
            } else if (percentual > thresholds.adequado) {
                inconsistenciasRelevantes++;
            } else if (percentual > thresholds.bom) {
                inconsistenciasLeves++;
            } else {
                anosSemInconsistencia++;
            }
        }

        const totalAnos = demonstracoes.balanco.periodos.length;

        if (anosSemInconsistencia === totalAnos) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (inconsistenciasLeves > 0 && inconsistenciasRelevantes === 0 && inconsistenciasGraves === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (inconsistenciasRelevantes <= 1 && inconsistenciasGraves === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (inconsistenciasGraves === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Liquidez Corrente
     * @private
     */
    #avaliarLiquidezCorrente(indices) {
        const msgCriterio = this.msg.categorias.capacidadePagamento.criterios.liquidezCorrente;
        const pontosPossiveis = this.pontuacao.categorias.capacidadePagamento.liquidezCorrente;

        if (!indices || !indices.liquidez || typeof indices.liquidez.corrente !== 'object') {
            throw new Error('ScoringEngine: indices.liquidez.corrente deve ter sido calculado antes - obrigatório');
        }

        const liquidez = indices.liquidez.corrente.valor;
        const valorFormatado = liquidez.toFixed(2);
        const thresholds = this.thresholds.capacidadePagamento.liquidezCorrente;

        if (liquidez > thresholds.excelente) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis,
                nivel: 'excelente',
                avaliacao: this.#formatMsg(msgCriterio.excelente, { valor: valorFormatado })
            };
        } else if (liquidez > thresholds.bom) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.bom,
                nivel: 'bom',
                avaliacao: this.#formatMsg(msgCriterio.bom, { valor: valorFormatado })
            };
        } else if (liquidez > thresholds.adequado) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.adequado,
                nivel: 'adequado',
                avaliacao: this.#formatMsg(msgCriterio.adequado, { valor: valorFormatado })
            };
        } else if (liquidez >= thresholds.baixo) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.baixo,
                nivel: 'baixo',
                avaliacao: this.#formatMsg(msgCriterio.baixo, { valor: valorFormatado })
            };
        } else {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.critico,
                nivel: 'critico',
                avaliacao: this.#formatMsg(msgCriterio.critico, { valor: valorFormatado })
            };
        }
    }

    /**
     * Avalia Cobertura de Juros
     * @private
     */
    #avaliarCoberturaJuros(indices) {
        const msgCriterio = this.msg.categorias.capacidadePagamento.criterios.coberturaJuros;
        const pontosPossiveis = this.pontuacao.categorias.capacidadePagamento.coberturaJuros;

        // Se não houver dados, pontuar como adequado
        if (!indices || !indices.rentabilidade || indices.rentabilidade.margemEBITDA === undefined) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.coberturaJuros,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const coberturaJuros = indices.coberturaJuros !== undefined ? indices.coberturaJuros : 2.5;
        const thresholds = this.thresholds.capacidadePagamento.coberturaJuros;

        if (coberturaJuros > thresholds.excelente) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (coberturaJuros > thresholds.bom) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (coberturaJuros > thresholds.adequado) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (coberturaJuros >= thresholds.baixo) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Geração de Caixa
     * @private
     */
    #avaliarGeracaoCaixa(indices) {
        const msgCriterio = this.msg.categorias.capacidadePagamento.criterios.geracaoCaixa;
        const pontosPossiveis = this.pontuacao.categorias.capacidadePagamento.geracaoCaixa;

        // Se não houver dados, pontuar como adequado
        if (!indices || indices.geracaoCaixa === undefined) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.geracaoCaixa,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const geracaoCaixa = indices.geracaoCaixa;
        const thresholds = this.thresholds.capacidadePagamento.geracaoCaixa;

        if (geracaoCaixa > thresholds.excelente) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (geracaoCaixa > thresholds.bom) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (geracaoCaixa > thresholds.adequado) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (geracaoCaixa >= thresholds.baixo) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Capital de Giro
     * @private
     */
    #avaliarCapitalGiro(capitalGiro) {
        const msgCriterio = this.msg.categorias.capacidadePagamento.criterios.capitalGiro;
        const pontosPossiveis = this.pontuacao.categorias.capacidadePagamento.capitalGiro;

        if (!capitalGiro || !capitalGiro.situacao || !capitalGiro.capitalGiroLiquido) {
            throw new Error('ScoringEngine: capitalGiro.situacao e capitalGiro.capitalGiroLiquido devem ter sido calculados antes - obrigatório');
        }

        const situacao = capitalGiro.situacao.tipo;
        const cgl = capitalGiro.capitalGiroLiquido.valor;
        const ac = capitalGiro.capitalGiroLiquido.ativoCirculante;
        const thresholds = this.thresholds.capacidadePagamento.cglSobreAC;

        if (situacao === 'situacao1' || situacao === 'situacao3') {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (ac > 0 && (cgl / ac) > thresholds.excelente) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (ac > 0 && (cgl / ac) > thresholds.bom) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (cgl > 0 && ac > 0 && (cgl / ac) > thresholds.adequado) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Nível de Endividamento
     * @private
     */
    #avaliarNivelEndividamento(ultimoPeriodo) {
        const msgCriterio = this.msg.categorias.endividamento.criterios.nivelEndividamento;
        const pontosPossiveis = this.pontuacao.categorias.endividamento.nivelEndividamento;

        if (!ultimoPeriodo.balanco) {
            throw new Error('ScoringEngine: ultimoPeriodo.balanco obrigatório para avaliar endividamento');
        }

        const balanco = ultimoPeriodo.balanco;
        const passivoExigivel = balanco.passivoTotal || 0;
        const pl = this.#somarValores(balanco.patrimonioLiquido);

        if (pl === 0) {
            // Se PL é zero e há passivo, o endividamento é infinito (crítico).
            // Se não há passivo, o endividamento é zero (excelente).
            return {
                nome: msgCriterio.nome,
                pontos: passivoExigivel > 0 ? pontosPossiveis * this.pontuacao.niveis.critico : pontosPossiveis,
                nivel: passivoExigivel > 0 ? 'critico' : 'excelente',
                avaliacao: passivoExigivel > 0 ? 'Patrimônio Líquido nulo com dívidas existentes.' : 'Sem dívidas e sem patrimônio líquido.'
            };
        }

        const endividamento = (passivoExigivel / pl) * 100;
        const valorFormatado = endividamento.toFixed(2);
        const thresholds = this.thresholds.endividamento.endividamentoSobrePL;

        if (endividamento < thresholds.excelente * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis,
                nivel: 'excelente',
                avaliacao: this.#formatMsg(msgCriterio.excelente, { valor: valorFormatado })
            };
        } else if (endividamento < thresholds.bom * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.bom,
                nivel: 'bom',
                avaliacao: this.#formatMsg(msgCriterio.bom, { valor: valorFormatado })
            };
        } else if (endividamento < thresholds.adequado * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.adequado,
                nivel: 'adequado',
                avaliacao: this.#formatMsg(msgCriterio.adequado, { valor: valorFormatado })
            };
        } else if (endividamento < thresholds.baixo * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.baixo,
                nivel: 'baixo',
                avaliacao: this.#formatMsg(msgCriterio.baixo, { valor: valorFormatado })
            };
        } else {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.critico,
                nivel: 'critico',
                avaliacao: this.#formatMsg(msgCriterio.critico, { valor: valorFormatado })
            };
        }
    }

    /**
     * Avalia Composição do Endividamento
     * @private
     */
    #avaliarComposicaoEndividamento(ultimoPeriodo) {
        const msgCriterio = this.msg.categorias.endividamento.criterios.composicaoEndividamento;
        const pontosPossiveis = this.pontuacao.categorias.endividamento.composicaoEndividamento;

        if (!ultimoPeriodo.balanco) {
            throw new Error('ScoringEngine: ultimoPeriodo.balanco obrigatório para avaliar composição de endividamento');
        }

        const balanco = ultimoPeriodo.balanco;
        const pc = balanco.passivoCirculanteTotal || 0;
        const pnc = balanco.passivoNaoCirculanteTotal || 0;
        const total = pc + pnc;

        if (total === 0) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis,
                nivel: 'excelente',
                avaliacao: this.#formatMsg(msgCriterio.excelente, { valor: '0.00' })
            };
        }

        const percentualCP = (pc / total) * 100;
        const valorFormatado = percentualCP.toFixed(2);
        const thresholds = this.thresholds.endividamento.dividaCPSobreTotal;

        if (percentualCP < thresholds.excelente * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis,
                nivel: 'excelente',
                avaliacao: this.#formatMsg(msgCriterio.excelente, { valor: valorFormatado })
            };
        } else if (percentualCP < thresholds.bom * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.bom,
                nivel: 'bom',
                avaliacao: this.#formatMsg(msgCriterio.bom, { valor: valorFormatado })
            };
        } else if (percentualCP < thresholds.adequado * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.adequado,
                nivel: 'adequado',
                avaliacao: this.#formatMsg(msgCriterio.adequado, { valor: valorFormatado })
            };
        } else if (percentualCP < thresholds.baixo * 100) {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.baixo,
                nivel: 'baixo',
                avaliacao: this.#formatMsg(msgCriterio.baixo, { valor: valorFormatado })
            };
        } else {
            return {
                nome: msgCriterio.nome,
                pontos: pontosPossiveis * this.pontuacao.niveis.critico,
                nivel: 'critico',
                avaliacao: this.#formatMsg(msgCriterio.critico, { valor: valorFormatado })
            };
        }
    }

    /**
     * Avalia Histórico de Pagamentos
     * @private
     */
    #avaliarHistoricoPagamentos(endividamento) {
        const msgCriterio = this.msg.categorias.endividamento.criterios.historicoPagamentos;
        const pontosPossiveis = this.pontuacao.categorias.endividamento.historicoPagamentos;

        // Se não houver dados, pontuar como adequado
        if (!endividamento || !endividamento.historicoPagamentos) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.historicoPagamentos,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const historico = endividamento.historicoPagamentos;
        const thresholds = this.thresholds.endividamento.historicoPagamentos;

        const semAtrasos = historico.filter(h => !h.atraso || h.atraso === 0);
        const atrasosLeves = historico.filter(h => h.atraso > 0 && h.atraso < thresholds.atrasoLeve);
        const atrasosModerados = historico.filter(h => h.atraso >= thresholds.atrasoLeve && h.atraso < thresholds.atrasoModerado);
        const atrasosGraves = historico.filter(h => h.atraso >= thresholds.atrasoModerado);

        const total = historico.length;

        if (total === 0) {
            return { nome: msgCriterio.nome, pontos: this.defaults.pontuacaoSemDados.historicoPagamentos, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        }

        if (semAtrasos.length === total) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (atrasosLeves.length > 0 && atrasosModerados.length === 0 && atrasosGraves.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (atrasosModerados.length <= total * thresholds.atrasosModeradosMaximo && atrasosGraves.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (atrasosGraves.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Inadimplência Histórica (NOVO - Adaptado Sicoob GRC)
     * Critério: Percentual de contas > 90 dias (fornecedores e clientes)
     * Pontuação: 5 pontos (integrado à categoria Endividamento)
     * @private
     * @param {Object} dadosInadimplencia - Dados de inadimplência
     * @returns {Object}
     */
    #avaliarInadimplenciaHistorica(dadosInadimplencia) {
        const pontosPossiveis = this.pontuacao.categorias.endividamento.inadimplenciaHistorica;
        const thresholds = this.thresholds.endividamento.inadimplenciaHistorica;

        // Validação de entrada
        if (!dadosInadimplencia) {
            return {
                pontos: this.defaults.pontuacaoSemDados.inadimplenciaHistorica ?? pontosPossiveis * 0.6,
                nivel: 'adequado',
                valor: null,
                observacao: 'Dados de inadimplência não disponíveis'
            };
        }

        // Obter dados de fornecedores e clientes
        const fornecedores = dadosInadimplencia.fornecedores;
        const clientes = dadosInadimplencia.clientes;

        // Calcular inadimplência de fornecedores
        let inadimplenciaFornecedores = null;
        if (fornecedores) {
            const contasPagarTotal = parseFloat(fornecedores.contasPagarTotal);
            const contasPagar90Dias = parseFloat(fornecedores.contasPagar90Dias);

            if (!isNaN(contasPagarTotal) && contasPagarTotal > 0 && !isNaN(contasPagar90Dias)) {
                inadimplenciaFornecedores = contasPagar90Dias / contasPagarTotal;
            }
        }

        // Calcular inadimplência de clientes
        let inadimplenciaClientes = null;
        if (clientes) {
            const contasReceberTotal = parseFloat(clientes.contasReceberTotal);
            const contasReceber90Dias = parseFloat(clientes.contasReceber90Dias);

            if (!isNaN(contasReceberTotal) && contasReceberTotal > 0 && !isNaN(contasReceber90Dias)) {
                inadimplenciaClientes = contasReceber90Dias / contasReceberTotal;
            }
        }

        // Se ambos são null, sem dados
        if (inadimplenciaFornecedores === null && inadimplenciaClientes === null) {
            return {
                pontos: this.defaults.pontuacaoSemDados.inadimplenciaHistorica ?? pontosPossiveis * 0.6,
                nivel: 'adequado',
                valor: null,
                observacao: 'Dados de contas a pagar/receber não disponíveis'
            };
        }

        // Usar o pior dos dois (maior inadimplência)
        let inadimplenciaGeral;
        if (inadimplenciaFornecedores !== null && inadimplenciaClientes !== null) {
            inadimplenciaGeral = Math.max(inadimplenciaFornecedores, inadimplenciaClientes);
        } else {
            inadimplenciaGeral = inadimplenciaFornecedores ?? inadimplenciaClientes;
        }

        // Classificar baseado em thresholds
        let nivel, pontos;
        if (inadimplenciaGeral <= thresholds.excelente) {
            nivel = 'excelente';
            pontos = pontosPossiveis * this.pontuacao.niveis.excelente;
        } else if (inadimplenciaGeral <= thresholds.bom) {
            nivel = 'bom';
            pontos = pontosPossiveis * this.pontuacao.niveis.bom;
        } else if (inadimplenciaGeral <= thresholds.adequado) {
            nivel = 'adequado';
            pontos = pontosPossiveis * this.pontuacao.niveis.adequado;
        } else if (inadimplenciaGeral < thresholds.critico) {
            nivel = 'baixo';
            pontos = pontosPossiveis * this.pontuacao.niveis.baixo;
        } else {
            nivel = 'crítico';
            pontos = pontosPossiveis * this.pontuacao.niveis.critico;
        }

        return {
            pontos,
            nivel,
            valor: inadimplenciaGeral,
            inadimplenciaPercentual: (inadimplenciaGeral * 100).toFixed(1),
            inadimplenciaFornecedores: inadimplenciaFornecedores !== null 
                ? (inadimplenciaFornecedores * 100).toFixed(1) 
                : null,
            inadimplenciaClientes: inadimplenciaClientes !== null 
                ? (inadimplenciaClientes * 100).toFixed(1) 
                : null,
            observacao: inadimplenciaGeral === 0 
                ? 'Sem inadimplência > 90 dias'
                : `${(inadimplenciaGeral * 100).toFixed(1)}% de contas com mais de 90 dias de atraso`
        };
    }

    /**
     * Avalia Concentração de Risco (NOVO - Adaptado Sicoob GRC)
     * Critério: Dependência de poucos clientes/fornecedores
     * Pontuação: 6 pontos (nova categoria Estrutura e Concentração)
     * @private
     * @param {Object} dadosConcentracao - Dados de concentração
     * @returns {Object}
     */
    #avaliarConcentracaoRisco(dadosConcentracao) {
        const pontosPossiveis = this.pontuacao.categorias.estruturaConcentracao.concentracaoRisco;
        const thresholds = this.thresholds.estruturaConcentracao.concentracaoRisco;

        // Validação de entrada
        if (!dadosConcentracao) {
            return {
                pontos: this.defaults.pontuacaoSemDados.concentracaoRisco ?? pontosPossiveis * 0.5,
                nivel: 'adequado',
                valor: null,
                observacao: 'Dados de concentração não disponíveis'
            };
        }

        // Obter concentração de clientes e fornecedores
        const concentracaoClientes = dadosConcentracao.concentracaoClientes;
        const concentracaoFornecedores = dadosConcentracao.concentracaoFornecedores;

        // Extrair valores percentuais
        let percClientes = null;
        if (concentracaoClientes?.valor !== null && concentracaoClientes?.valor !== undefined) {
            percClientes = parseFloat(concentracaoClientes.valor) / 100; // Converter de % para decimal
        }

        let percFornecedores = null;
        if (concentracaoFornecedores?.valor !== null && concentracaoFornecedores?.valor !== undefined) {
            percFornecedores = parseFloat(concentracaoFornecedores.valor) / 100;
        }

        // Se ambos são null, sem dados
        if (percClientes === null && percFornecedores === null) {
            return {
                pontos: this.defaults.pontuacaoSemDados.concentracaoRisco ?? pontosPossiveis * 0.5,
                nivel: 'adequado',
                valor: null,
                observacao: 'Dados de clientes/fornecedores não disponíveis'
            };
        }

        // Usar o pior dos dois (maior concentração = maior risco)
        let concentracaoGeral;
        if (percClientes !== null && percFornecedores !== null) {
            concentracaoGeral = Math.max(percClientes, percFornecedores);
        } else {
            concentracaoGeral = percClientes ?? percFornecedores;
        }

        // Classificar baseado em thresholds (quanto menor, melhor)
        let nivel, pontos;
        if (concentracaoGeral <= thresholds.excelente) {
            nivel = 'excelente';
            pontos = pontosPossiveis * this.pontuacao.niveis.excelente;
        } else if (concentracaoGeral <= thresholds.bom) {
            nivel = 'bom';
            pontos = pontosPossiveis * this.pontuacao.niveis.bom;
        } else if (concentracaoGeral <= thresholds.adequado) {
            nivel = 'adequado';
            pontos = pontosPossiveis * this.pontuacao.niveis.adequado;
        } else if (concentracaoGeral < thresholds.critico) {
            nivel = 'baixo';
            pontos = pontosPossiveis * this.pontuacao.niveis.baixo;
        } else {
            nivel = 'crítico';
            pontos = pontosPossiveis * this.pontuacao.niveis.critico;
        }

        return {
            pontos,
            nivel,
            valor: concentracaoGeral,
            concentracaoPercentual: (concentracaoGeral * 100).toFixed(1),
            concentracaoClientes: percClientes !== null ? (percClientes * 100).toFixed(1) : null,
            concentracaoFornecedores: percFornecedores !== null ? (percFornecedores * 100).toFixed(1) : null,
            observacao: concentracaoGeral <= 0.30 
                ? 'Boa diversificação de clientes/fornecedores'
                : `${(concentracaoGeral * 100).toFixed(1)}% de concentração (risco elevado)`
        };
    }

    /**
     * Avalia Ciclo Operacional (NOVO - Adaptado Sicoob GRC)
     * Critério: Eficiência do ciclo operacional e financeiro
     * Pontuação: 4 pontos (nova categoria Estrutura e Concentração)
     * @private
     * @param {Object} dadosCiclos - Dados de ciclos operacionais
     * @returns {Object}
     */
    #avaliarCicloOperacional(dadosCiclos) {
        const pontosPossiveis = this.pontuacao.categorias.estruturaConcentracao.cicloOperacional;
        const thresholds = this.thresholds.estruturaConcentracao.cicloFinanceiro;

        // Validação de entrada
        if (!dadosCiclos) {
            return {
                pontos: this.defaults.pontuacaoSemDados.cicloOperacional ?? pontosPossiveis * 0.6,
                nivel: 'adequado',
                valor: null,
                observacao: 'Dados de ciclos operacionais não disponíveis'
            };
        }

        // Priorizar Ciclo Financeiro (mais importante)
        const cicloFinanceiro = dadosCiclos.cicloFinanceiro;
        const cicloOperacional = dadosCiclos.cicloOperacional;

        let valorCiclo = null;
        let tipoCiclo = null;

        // Usar Ciclo Financeiro se disponível, senão Ciclo Operacional
        if (cicloFinanceiro?.valor !== null && cicloFinanceiro?.valor !== undefined) {
            valorCiclo = parseFloat(cicloFinanceiro.valor);
            tipoCiclo = 'financeiro';
        } else if (cicloOperacional?.valor !== null && cicloOperacional?.valor !== undefined) {
            valorCiclo = parseFloat(cicloOperacional.valor);
            tipoCiclo = 'operacional';
        }

        if (valorCiclo === null || isNaN(valorCiclo)) {
            return {
                pontos: this.defaults.pontuacaoSemDados.cicloOperacional ?? pontosPossiveis * 0.6,
                nivel: 'adequado',
                valor: null,
                observacao: 'Ciclos operacionais não calculados'
            };
        }

        // Classificar baseado em thresholds (quanto menor, melhor)
        let nivel, pontos;
        if (valorCiclo <= thresholds.excelente) {
            nivel = 'excelente';
            pontos = pontosPossiveis * this.pontuacao.niveis.excelente;
        } else if (valorCiclo <= thresholds.bom) {
            nivel = 'bom';
            pontos = pontosPossiveis * this.pontuacao.niveis.bom;
        } else if (valorCiclo <= thresholds.adequado) {
            nivel = 'adequado';
            pontos = pontosPossiveis * this.pontuacao.niveis.adequado;
        } else if (valorCiclo < thresholds.critico) {
            nivel = 'baixo';
            pontos = pontosPossiveis * this.pontuacao.niveis.baixo;
        } else {
            nivel = 'crítico';
            pontos = pontosPossiveis * this.pontuacao.niveis.critico;
        }

        return {
            pontos,
            nivel,
            valor: valorCiclo,
            tipoCiclo,
            dias: valorCiclo.toFixed(0),
            observacao: valorCiclo <= 0 
                ? 'Empresa financia operação com fornecedores (excelente)'
                : `Ciclo ${tipoCiclo} de ${valorCiclo.toFixed(0)} dias`
        };
    }

    /**
     * Avalia Estrutura e Concentração (NOVA CATEGORIA - Adaptado Sicoob GRC)
     * Combina: concentração de risco, ciclos operacionais, garantias e relacionamento
     * Pontuação total: 15 pontos
     * @private
     * @param {Object} dados - Dados de concentração, ciclos, garantias e relacionamento
     * @returns {Object}
     */
    #avaliarEstrutura(dados) {
        const peso = 15; // Total da nova categoria
        const msgCategoria = this.msg.categorias?.estruturaConcentracao ?? { nome: 'Estrutura e Concentração' };

        let pontos = 0;
        const criterios = {};

        // Critério 1: Concentração de Risco (6 pts)
        const concentracaoRisco = this.#avaliarConcentracaoRisco(dados.concentracao);
        criterios.concentracaoRisco = concentracaoRisco;
        pontos += concentracaoRisco.pontos;

        // Critério 2: Ciclo Operacional/Financeiro (4 pts)
        const cicloOperacional = this.#avaliarCicloOperacional(dados.ciclos);
        criterios.cicloOperacional = cicloOperacional;
        pontos += cicloOperacional.pontos;

        // Critério 3: Garantias Disponíveis (3 pts) - movido da categoria antiga
        const garantiasDisponiveis = this.#avaliarGarantiasDisponiveis(dados.garantias);
        criterios.garantiasDisponiveis = garantiasDisponiveis;
        pontos += garantiasDisponiveis.pontos;

        // Critério 4: Tempo de Relacionamento (2 pts) - movido da categoria antiga
        const tempoRelacionamento = this.#avaliarTempoRelacionamento(dados.relacionamento);
        criterios.tempoRelacionamento = tempoRelacionamento;
        pontos += tempoRelacionamento.pontos;

        return {
            nome: msgCategoria.nome,
            peso,
            pontuacao: Math.min(pontos, peso),
            criterios
        };
    }

    /**
     * Avalia Garantias Disponíveis
     * @private
     */
    #avaliarGarantiasDisponiveis(garantias) {
        const msgCriterio = this.msg.categorias.estruturaConcentracao.criterios.garantiasDisponiveis;
        const pontosPossiveis = this.pontuacao.categorias.estruturaConcentracao.garantiasDisponiveis;

        // Se não houver dados, pontuar como adequado
        if (!garantias || !garantias.valorSolicitado || !garantias.valorGarantias) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.garantias,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const valorSolicitado = garantias.valorSolicitado;
        const valorGarantias = garantias.valorGarantias;

        if (valorSolicitado === 0) {
            return { nome: msgCriterio.nome, pontos: this.defaults.pontuacaoSemDados.garantias, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        }

        const cobertura = valorGarantias / valorSolicitado;
        const thresholds = this.thresholds.garantias.garantiasSobreValor;

        if (cobertura > thresholds.excelente) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (cobertura >= thresholds.bom) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (cobertura >= thresholds.adequado) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (cobertura > 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Tempo de Relacionamento
     * @private
     */
    #avaliarTempoRelacionamento(relacionamento) {
        const msgCriterio = this.msg.categorias.estruturaConcentracao.criterios.tempoRelacionamento;
        const pontosPossiveis = this.pontuacao.categorias.estruturaConcentracao.tempoRelacionamento;

        // Se não houver dados, pontuar como adequado
        if (!relacionamento || !relacionamento.dataInicio) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.relacionamento,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const dataInicio = new Date(relacionamento.dataInicio);
        const hoje = new Date();
        const diffMs = hoje - dataInicio;
        const anos = diffMs / (1000 * 60 * 60 * 24 * 365.25);
        const thresholds = this.thresholds.garantias.tempoRelacionamento;

        if (anos >= thresholds.excelente) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (anos >= thresholds.bom) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (anos >= thresholds.adequado) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (anos >= thresholds.baixo) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Avalia Operações Anteriores
     * @private
     */
    #avaliarOperacoesAnteriores(relacionamento) {
        const msgCriterio = this.msg.categorias.garantias.criterios.operacoesAnteriores;
        const pontosPossiveis = this.pontuacao.categorias.garantias.operacoesAnteriores;

        // Se não houver dados, pontuar como adequado
        if (!relacionamento || !relacionamento.operacoesAnteriores) {
            return {
                nome: msgCriterio.nome,
                pontos: this.defaults.pontuacaoSemDados.operacoesAnteriores,
                nivel: 'adequado',
                avaliacao: msgCriterio.adequado
            };
        }

        const operacoes = relacionamento.operacoesAnteriores;

        if (operacoes.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }

        const thresholds = this.thresholds.garantias.operacoesAnteriores;
        const liquidadasSemAtraso = operacoes.filter(op => op.status === 'liquidada' && (!op.atrasoMaximo || op.atrasoMaximo === 0));
        const liquidadasComAtrasoLeve = operacoes.filter(op => op.status === 'liquidada' && op.atrasoMaximo > 0 && op.atrasoMaximo < thresholds.atrasoLeve);
        const liquidadasComAtrasoModerado = operacoes.filter(op => op.status === 'liquidada' && op.atrasoMaximo >= thresholds.atrasoLeve && op.atrasoMaximo < thresholds.atrasoModerado);
        const liquidadasComAtrasoGrave = operacoes.filter(op => op.status === 'liquidada' && op.atrasoMaximo >= thresholds.atrasoModerado);
        const comProblemas = operacoes.filter(op => op.status !== 'liquidada');

        if (liquidadasSemAtraso.length > thresholds.minimoExcelente && liquidadasComAtrasoLeve.length === 0 && comProblemas.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis, nivel: 'excelente', avaliacao: msgCriterio.excelente };
        } else if (liquidadasComAtrasoLeve.length > 0 && liquidadasComAtrasoModerado.length === 0 && comProblemas.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.bom, nivel: 'bom', avaliacao: msgCriterio.bom };
        } else if (liquidadasComAtrasoModerado.length > 0 && liquidadasComAtrasoGrave.length === 0 && comProblemas.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.adequado, nivel: 'adequado', avaliacao: msgCriterio.adequado };
        } else if (liquidadasComAtrasoGrave.length > 0 && comProblemas.length === 0) {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.baixo, nivel: 'baixo', avaliacao: msgCriterio.baixo };
        } else {
            return { nome: msgCriterio.nome, pontos: pontosPossiveis * this.pontuacao.niveis.critico, nivel: 'critico', avaliacao: msgCriterio.critico };
        }
    }

    /**
     * Determina classificação de risco baseada na pontuação total
     * @private
     */

    /**
     * SCORING DINÂMICO - Recalcula score e detecta variações significativas
     * Método público para recálculo em tempo real
     * @param {Object} data - Dados completos para cálculo
     * @param {Object} opcoes - Opções de recálculo
     * @param {boolean} opcoes.salvarHistorico - Se deve salvar no histórico (padrão: true)
     * @param {boolean} opcoes.gerarAlertas - Se deve gerar alertas de variação (padrão: true)
     * @returns {Promise<Object>} Resultado com score atual e alertas de variação
     */
    async recalcularScoreDinamico(data, opcoes = {}) {
        const { salvarHistorico = true, gerarAlertas = true } = opcoes;

        // Obter score anterior do localStorage
        const scoreAnterior = this.#obterScoreAnterior();

        // Calcular novo score
        const novoScore = await this.calcularScoring(data);

        // Detectar mudanças significativas
        let alertasVariacao = [];
        if (gerarAlertas && scoreAnterior) {
            alertasVariacao = this.#detectarMudancasSignificativas(
                scoreAnterior.pontuacaoTotal,
                novoScore.pontuacaoTotal
            );
        }

        // Salvar histórico
        if (salvarHistorico) {
            this.#salvarHistoricoScore(novoScore);
        }

        return {
            ...novoScore,
            scoreAnterior: scoreAnterior?.pontuacaoTotal ?? null,
            variacao: scoreAnterior 
                ? novoScore.pontuacaoTotal - scoreAnterior.pontuacaoTotal 
                : null,
            alertasVariacao,
            historico: this.#obterHistoricoScore()
        };
    }

    /**
     * Detecta mudanças significativas no score
     * Baseado em thresholds do scoring-criteria.json
     * @private
     * @param {number} scoreAnterior - Pontuação anterior
     * @param {number} scoreNovo - Pontuação nova
     * @returns {Array} Lista de alertas de variação
     */
    #detectarMudancasSignificativas(scoreAnterior, scoreNovo) {
        const alertas = [];
        const variacao = scoreNovo - scoreAnterior;
        const variacaoAbsoluta = Math.abs(variacao);

        // Obter thresholds de scoring dinâmico
        const thresholds = this.criteria.alertas?.scoringDinamico ?? {
            variacaoCritica: 15,
            variacaoAtencao: 10,
            variacaoInformativa: 5
        };

        // Alerta Crítico (variação >= 15 pontos)
        if (variacaoAbsoluta >= thresholds.variacaoCritica) {
            alertas.push({
                tipo: variacao > 0 ? 'informativo' : 'critico',
                mensagem: variacao > 0 
                    ? `Score aumentou ${variacao} pontos (de ${scoreAnterior} para ${scoreNovo})`
                    : `Score caiu ${Math.abs(variacao)} pontos (de ${scoreAnterior} para ${scoreNovo})`,
                recomendacao: variacao > 0
                    ? 'Melhoria significativa identificada - manter tendência positiva'
                    : 'Queda crítica no score - revisão urgente dos indicadores necessária',
                variacao,
                timestamp: new Date().toISOString()
            });
        }
        // Alerta de Atenção (variação >= 10 pontos)
        else if (variacaoAbsoluta >= thresholds.variacaoAtencao) {
            alertas.push({
                tipo: 'atencao',
                mensagem: variacao > 0 
                    ? `Score melhorou ${variacao} pontos (de ${scoreAnterior} para ${scoreNovo})`
                    : `Score reduziu ${Math.abs(variacao)} pontos (de ${scoreAnterior} para ${scoreNovo})`,
                recomendacao: variacao > 0
                    ? 'Evolução positiva detectada'
                    : 'Monitorar indicadores que causaram a queda',
                variacao,
                timestamp: new Date().toISOString()
            });
        }
        // Alerta Informativo (variação >= 5 pontos)
        else if (variacaoAbsoluta >= thresholds.variacaoInformativa) {
            alertas.push({
                tipo: 'informativo',
                mensagem: variacao > 0 
                    ? `Score subiu ${variacao} pontos`
                    : `Score desceu ${Math.abs(variacao)} pontos`,
                variacao,
                timestamp: new Date().toISOString()
            });
        }

        return alertas;
    }

    /**
     * Salva score no histórico (localStorage)
     * @private
     * @param {Object} score - Resultado do scoring
     */
    #salvarHistoricoScore(score) {
        try {
            const historicoKey = 'creditscore_historico_scores';
            let historico = JSON.parse(localStorage.getItem(historicoKey) ?? '[]');

            // Limitar a 50 entradas (últimas 50 análises)
            if (historico.length >= 50) {
                historico = historico.slice(-49);
            }

            // Adicionar novo score ao histórico
            historico.push({
                pontuacaoTotal: score.pontuacaoTotal,
                classificacao: score.classificacao.rating,
                timestamp: new Date().toISOString(),
                categorias: {
                    cadastral: score.categorias.cadastral.pontuacao,
                    financeiro: score.categorias.financeiro.pontuacao,
                    capacidadePagamento: score.categorias.capacidadePagamento.pontuacao,
                    endividamento: score.categorias.endividamento.pontuacao,
                    estruturaConcentracao: score.categorias.estruturaConcentracao.pontuacao
                }
            });

            localStorage.setItem(historicoKey, JSON.stringify(historico));
        } catch (error) {
            console.warn('Erro ao salvar histórico de score:', error);
        }
    }

    /**
     * Obtém score anterior do localStorage
     * @private
     * @returns {Object|null}
     */
    #obterScoreAnterior() {
        try {
            const historicoKey = 'creditscore_historico_scores';
            const historico = JSON.parse(localStorage.getItem(historicoKey) ?? '[]');
            
            if (historico.length === 0) {
                return null;
            }

            // Retornar último score
            return historico[historico.length - 1];
        } catch (error) {
            console.warn('Erro ao obter score anterior:', error);
            return null;
        }
    }

    /**
     * Obtém histórico completo de scores
     * @private
     * @returns {Array}
     */
    #obterHistoricoScore() {
        try {
            const historicoKey = 'creditscore_historico_scores';
            return JSON.parse(localStorage.getItem(historicoKey) ?? '[]');
        } catch (error) {
            console.warn('Erro ao obter histórico de scores:', error);
            return [];
        }
    }

    #determinarClassificacao(pontuacao) {
        for (const classificacao of this.config.classificacoes) {
            if (pontuacao >= classificacao.min && pontuacao <= classificacao.max) {
                const msgClassificacao = this.msg.classificacoes[classificacao.rating];
                return {
                    rating: classificacao.rating,
                    pontuacao,
                    faixa: `${classificacao.min}-${classificacao.max}`,
                    risco: classificacao.risco,
                    cor: classificacao.cor,
                    descricao: msgClassificacao.descricao,
                    interpretacao: msgClassificacao.interpretacao,
                    recomendacao: msgClassificacao.recomendacao,
                    acoes: msgClassificacao.acoes
                };
            }
        }

        // Se não encontrou classificação, retornar D
        const msgD = this.msg.classificacoes.D;
        return {
            rating: 'D',
            pontuacao,
            faixa: '0-29',
            risco: 'Extremo',
            cor: '#D32F2F',
            descricao: msgD.descricao,
            interpretacao: msgD.interpretacao,
            recomendacao: msgD.recomendacao,
            acoes: msgD.acoes
        };
    }

    /**
     * Gera alertas baseados na pontuação e categorias
     * @private
     */
    #gerarAlertas(pontuacaoTotal, categorias) {
        const alertas = [];
        const alertasConfig = this.criteria.alertas;

        // Alerta geral por pontuação
        if (pontuacaoTotal < alertasConfig.pontuacao.extremo) {
            alertas.push(this.msg.alertas.scoringExtremo);
        } else if (pontuacaoTotal < alertasConfig.pontuacao.critico) {
            alertas.push(this.msg.alertas.scoringCritico);
        } else if (pontuacaoTotal < alertasConfig.pontuacao.baixo) {
            alertas.push(this.msg.alertas.scoringBaixo);
        }

        // Alertas por categoria crítica
        for (const [nomeCategoria, categoria] of Object.entries(categorias)) {
            const percentual = categoria.pontuacao / categoria.peso;
            if (percentual < alertasConfig.categoria.percentualCritico) {
                alertas.push(
                    this.#formatMsg(this.msg.alertas.categoriaCritica, {
                        nome: categoria.nome,
                        pontos: categoria.pontuacao.toFixed(2),
                        peso: categoria.peso
                    })
                );
            }

            // Alertas por critério crítico
            for (const [nomeCriterio, criterio] of Object.entries(categoria.criterios)) {
                if (criterio.nivel === 'critico') {
                    alertas.push(
                        this.#formatMsg(this.msg.alertas.criterioCritico, {
                            criterio: criterio.nome
                        })
                    );
                }
            }
        }

        return alertas;
    }

    /**
     * Gera recomendações baseadas nas categorias
     * @private
     */
    #gerarRecomendacoes(categorias) {
        const recomendacoes = [];
        const percentualMinimo = this.criteria.recomendacoes.categoria.percentualMinimo;

        if (categorias.cadastral.pontuacao / categorias.cadastral.peso < percentualMinimo) {
            recomendacoes.push(this.msg.recomendacoes.melhorarCadastral);
        }

        if (categorias.financeiro.pontuacao / categorias.financeiro.peso < percentualMinimo) {
            recomendacoes.push(this.msg.recomendacoes.melhorarFinanceiro);
        }

        if (categorias.capacidadePagamento.pontuacao / categorias.capacidadePagamento.peso < percentualMinimo) {
            recomendacoes.push(this.msg.recomendacoes.melhorarCapacidade);
        }

        if (categorias.endividamento.pontuacao / categorias.endividamento.peso < percentualMinimo) {
            recomendacoes.push(this.msg.recomendacoes.melhorarEndividamento);
        }

        if (categorias.estruturaConcentracao.pontuacao / categorias.estruturaConcentracao.peso < percentualMinimo) {
            recomendacoes.push(this.msg.recomendacoes.melhorarEstrutura);
        }

        return recomendacoes;
    }

    /**
     * Soma valores de um objeto recursivamente
     * @private
     */
    #somarValores(obj) {
        if (typeof obj === 'number') {
            return obj;
        }
        if (typeof obj !== 'object' || obj === null) {
            return 0;
        }
        let soma = 0;
        for (const valor of Object.values(obj)) {
            soma += this.#somarValores(valor);
        }
        return soma;
    }

    /**
     * Formata mensagem substituindo placeholders
     * @private
     */
    #formatMsg(template, vars) {
        if (!template) {
            throw new Error('ScoringEngine: template de mensagem não fornecido');
        }
        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            const placeholder = `{${key}}`;
            const replacement = typeof value === 'number'
                ? value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                : String(value);
            result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), replacement);
        }
        return result;
    }
}

// Expor globalmente
window.ScoringEngine = ScoringEngine;
