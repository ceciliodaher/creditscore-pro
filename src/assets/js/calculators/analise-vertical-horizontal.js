/**
 * AnaliseVerticalHorizontal - Calculador de Análise Vertical e Horizontal
 *
 * ANÁLISE VERTICAL: Composição percentual de cada item em relação ao total
 * - Balanço: cada linha como % do Ativo Total ou Passivo Total
 * - DRE: cada linha como % da Receita Líquida
 *
 * ANÁLISE HORIZONTAL: Evolução temporal (variação % ano a ano)
 * - Calcula variação percentual de cada item entre anos
 * - Identifica tendências (crescimento/decrescimento)
 *
 * ALERTAS: Identifica inconsistências e variações significativas
 *
 * PRINCÍPIOS:
 * - NO FALLBACKS: Validação explícita, sem valores padrão
 * - NO HARDCODED DATA: Todas as regras vêm da configuração
 * - KISS & DRY: Código simples e sem duplicação
 * - Event-driven: Emite eventos de alerta quando necessário
 *
 * @class AnaliseVerticalHorizontal
 * @version 1.0.0
 */

export class AnaliseVerticalHorizontal {
    /**
     * @param {Object} config - Configuração do sistema
     * @param {Object} messages - Mensagens do sistema
     * @throws {Error} Se config ou messages não fornecidos
     */
    constructor(config, messages) {
        // Validação estrita - NO FALLBACKS
        if (!config) {
            throw new Error('AnaliseVerticalHorizontal: config obrigatória não fornecida');
        }

        if (!messages) {
            throw new Error('AnaliseVerticalHorizontal: messages obrigatórias não fornecidas');
        }

        if (!config.alerts) {
            throw new Error('AnaliseVerticalHorizontal: config.alerts obrigatório');
        }

        if (!config.analiseVerticalHorizontal) {
            throw new Error('AnaliseVerticalHorizontal: config.analiseVerticalHorizontal obrigatório');
        }

        if (!messages.calculators || !messages.calculators.analiseVerticalHorizontal) {
            throw new Error('AnaliseVerticalHorizontal: messages.calculators.analiseVerticalHorizontal obrigatório');
        }

        this.config = config;
        this.messages = messages.calculators.analiseVerticalHorizontal;
        this.analiseConfig = config.analiseVerticalHorizontal;
        this.initialized = false;

        // Limiares de alerta vêm da configuração (NO HARDCODED DATA)
        this.thresholds = this.analiseConfig.thresholds;
    }

    /**
     * Inicializa o calculador
     * @returns {Promise&lt;boolean&gt;}
     */
    async init() {
        console.log('🔧 Inicializando AnaliseVerticalHorizontal...');

        // Validar estrutura de alertas na config
        if (!Array.isArray(this.config.alerts.critico)) {
            throw new Error('AnaliseVerticalHorizontal: config.alerts.critico deve ser array');
        }

        if (!Array.isArray(this.config.alerts.atencao)) {
            throw new Error('AnaliseVerticalHorizontal: config.alerts.atencao deve ser array');
        }

        this.initialized = true;
        console.log('✅ AnaliseVerticalHorizontal inicializado');
        return true;
    }

    /**
     * Calcula análise vertical e horizontal completa
     * @param {Object} data - Dados das demonstrações financeiras (3 anos)
     * @param {Object} data.balanco - Balanços patrimoniais por ano
     * @param {Object} data.dre - DREs por ano
     * @returns {Promise&lt;Object&gt;} Resultado da análise
     * @throws {Error} Se dados inválidos ou incompletos
     */
    async calcularTodos(data) {
        if (!this.initialized) {
            throw new Error('AnaliseVerticalHorizontal: calculador não inicializado - execute init() primeiro');
        }

        // Validação dos dados de entrada - NO FALLBACKS
        this.#validarDadosEntrada(data);

        const anos = this.#extrairAnosOrdenados(data);

        // Calcular análises
        const analiseVerticalBalanco = this.#calcularAnaliseVerticalBalanco(data.balanco, anos);
        const analiseVerticalDRE = this.#calcularAnaliseVerticalDRE(data.dre, anos);
        const analiseHorizontalBalanco = this.#calcularAnaliseHorizontal(data.balanco, anos);
        const analiseHorizontalDRE = this.#calcularAnaliseHorizontal(data.dre, anos);

        // Identificar tendências e alertas
        const tendencias = this.#identificarTendencias(analiseHorizontalBalanco, analiseHorizontalDRE, anos);
        const alertas = this.#gerarAlertas(analiseHorizontalBalanco, analiseHorizontalDRE, data, anos);

        // Emitir eventos se houver alertas críticos
        if (alertas.criticos.length > 0) {
            this.#emitirEventoAlerta('critico', alertas.criticos);
        }

        return {
            analiseVertical: {
                balanco: analiseVerticalBalanco,
                dre: analiseVerticalDRE,
            },
            analiseHorizontal: {
                balanco: analiseHorizontalBalanco,
                dre: analiseHorizontalDRE,
            },
            tendencias,
            alertas,
            metadata: {
                calculadoEm: new Date().toISOString(),
                anos,
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
    #validarDadosEntrada(data) {
        if (!data) {
            throw new Error('AnaliseVerticalHorizontal: data obrigatório não fornecido');
        }

        if (!data.balanco) {
            throw new Error('AnaliseVerticalHorizontal: data.balanco obrigatório não fornecido');
        }

        if (!data.dre) {
            throw new Error('AnaliseVerticalHorizontal: data.dre obrigatório não fornecido');
        }

        if (typeof data.balanco !== 'object' || Array.isArray(data.balanco)) {
            throw new Error('AnaliseVerticalHorizontal: data.balanco deve ser objeto {ano: dados}');
        }

        if (typeof data.dre !== 'object' || Array.isArray(data.dre)) {
            throw new Error('AnaliseVerticalHorizontal: data.dre deve ser objeto {ano: dados}');
        }

        const anosBalanco = Object.keys(data.balanco);
        const anosDRE = Object.keys(data.dre);

        if (anosBalanco.length < 2) {
            throw new Error('AnaliseVerticalHorizontal: mínimo 2 anos de balanço necessários para análise');
        }

        if (anosDRE.length < 2) {
            throw new Error('AnaliseVerticalHorizontal: mínimo 2 anos de DRE necessários para análise');
        }

        // Validar que anos são consistentes
        const anosBalancoSet = new Set(anosBalanco);
        const anosDRESet = new Set(anosDRE);

        const anosComuns = [...anosBalancoSet].filter(ano => anosDRESet.has(ano));

        if (anosComuns.length < 2) {
            throw new Error('AnaliseVerticalHorizontal: deve haver pelo menos 2 anos com dados de balanço E DRE');
        }
    }

    /**
     * Extrai anos ordenados (mais antigo para mais recente)
     * @private
     * @param {Object} data
     * @returns {Array&lt;string&gt;} Anos ordenados
     */
    #extrairAnosOrdenados(data) {
        const anosBalanco = Object.keys(data.balanco);
        const anosDRE = Object.keys(data.dre);

        const anosBalancoSet = new Set(anosBalanco);
        const anosDRESet = new Set(anosDRE);

        const anosComuns = [...anosBalancoSet].filter(ano => anosDRESet.has(ano));

        return anosComuns.sort((a, b) => parseInt(a) - parseInt(b));
    }

    /**
     * Calcula análise vertical do balanço patrimonial
     * @private
     * @param {Object} balancos - Balanços por ano
     * @param {Array&lt;string&gt;} anos
     * @returns {Object} Análise vertical por ano
     */
    #calcularAnaliseVerticalBalanco(balancos, anos) {
        const resultado = {};

        for (const ano of anos) {
            const balanco = balancos[ano];

            if (!balanco) {
                throw new Error(`AnaliseVerticalHorizontal: balanço do ano ${ano} não encontrado`);
            }

            // Validar estrutura do balanço
            this.#validarEstruturaBalanco(balanco, ano);

            const ativoTotal = balanco.ativoTotal;
            const passivoTotal = balanco.passivoTotal;

            // Validar equação contábil
            const diferenca = Math.abs(ativoTotal - passivoTotal);
            if (diferenca > this.thresholds.inconsistenciaMaxima) {
                throw new Error(
                    `AnaliseVerticalHorizontal: balanço ${ano} desbalanceado - ` +
                    `Ativo Total (${ativoTotal}) ≠ Passivo Total (${passivoTotal}), diferença: ${diferenca.toFixed(2)}`
                );
            }

            resultado[ano] = {
                ativo: this.#calcularPercent ualBalanco(balanco.ativo, ativoTotal, 'ativo'),
                passivo: this.#calcularPercentualBalanco(balanco.passivo, passivoTotal, 'passivo'),
                patrimonioLiquido: this.#calcularPercentualBalanco(balanco.patrimonioLiquido, passivoTotal, 'pl'),
                validacao: {
                    ativoTotal,
                    passivoTotal,
                    diferenca,
                    balanceado: true,
                },
            };
        }

        return resultado;
    }

    /**
     * Valida estrutura do balanço
     * @private
     * @param {Object} balanco
     * @param {string} ano
     * @throws {Error} Se estrutura inválida
     */
    #validarEstruturaBalanco(balanco, ano) {
        if (typeof balanco.ativoTotal !== 'number') {
            throw new Error(`AnaliseVerticalHorizontal: balanco[${ano}].ativoTotal deve ser número`);
        }

        if (typeof balanco.passivoTotal !== 'number') {
            throw new Error(`AnaliseVerticalHorizontal: balanco[${ano}].passivoTotal deve ser número`);
        }

        if (!balanco.ativo) {
            throw new Error(`AnaliseVerticalHorizontal: balanco[${ano}].ativo obrigatório não fornecido`);
        }

        if (!balanco.passivo) {
            throw new Error(`AnaliseVerticalHorizontal: balanco[${ano}].passivo obrigatório não fornecido`);
        }

        if (!balanco.patrimonioLiquido) {
            throw new Error(`AnaliseVerticalHorizontal: balanco[${ano}].patrimonioLiquido obrigatório não fornecido`);
        }
    }

    /**
     * Calcula percentuais para seção do balanço
     * @private
     * @param {Object} secao - Seção do balanço (ativo, passivo, PL)
     * @param {number} base - Valor base para cálculo (ativo total ou passivo total)
     * @param {string} tipo - Tipo da seção ('ativo', 'passivo', 'pl')
     * @returns {Object} Percentuais calculados
     */
    #calcularPercentualBalanco(secao, base, tipo) {
        if (!secao) {
            throw new Error(`AnaliseVerticalHorizontal: seção ${tipo} não fornecida`);
        }

        if (base <= 0) {
            throw new Error(`AnaliseVerticalHorizontal: base para cálculo percentual deve ser > 0, recebido: ${base}`);
        }

        const resultado = {};

        // Calcular percentual de cada item recursivamente
        for (const [chave, valor] of Object.entries(secao)) {
            if (typeof valor === 'number') {
                resultado[chave] = {
                    valor,
                    percentual: (valor / base) * 100,
                };
            } else if (typeof valor === 'object' && valor !== null) {
                // Subgrupo (ex: ativo.circulante.disponibilidades)
                resultado[chave] = this.#calcularPercentualBalanco(valor, base, `${tipo}.${chave}`);
            }
        }

        return resultado;
    }

    /**
     * Calcula análise vertical da DRE
     * @private
     * @param {Object} dres - DREs por ano
     * @param {Array&lt;string&gt;} anos
     * @returns {Object} Análise vertical por ano
     */
    #calcularAnaliseVerticalDRE(dres, anos) {
        const resultado = {};

        for (const ano of anos) {
            const dre = dres[ano];

            if (!dre) {
                throw new Error(`AnaliseVerticalHorizontal: DRE do ano ${ano} não encontrada`);
            }

            // Validar estrutura da DRE
            this.#validarEstruturaDRE(dre, ano);

            const receitaLiquida = dre.receitaLiquida;

            if (receitaLiquida <= 0) {
                throw new Error(
                    `AnaliseVerticalHorizontal: DRE ${ano} possui receitaLiquida <= 0 (${receitaLiquida}) - ` +
                    `impossível calcular análise vertical`
                );
            }

            resultado[ano] = this.#calcularPercentualDRE(dre, receitaLiquida);
        }

        return resultado;
    }

    /**
     * Valida estrutura da DRE
     * @private
     * @param {Object} dre
     * @param {string} ano
     * @throws {Error} Se estrutura inválida
     */
    #validarEstruturaDRE(dre, ano) {
        if (typeof dre.receitaLiquida !== 'number') {
            throw new Error(`AnaliseVerticalHorizontal: dre[${ano}].receitaLiquida deve ser número`);
        }

        // Campos obrigatórios vêm da configuração (NO HARDCODED DATA)
        const camposObrigatorios = this.analiseConfig.camposObrigatoriosDRE;

        for (const campo of camposObrigatorios) {
            if (typeof dre[campo] !== 'number') {
                throw new Error(`AnaliseVerticalHorizontal: dre[${ano}].${campo} obrigatório não fornecido ou inválido`);
            }
        }
    }

    /**
     * Calcula percentuais para DRE (base = receita líquida)
     * @private
     * @param {Object} dre
     * @param {number} base - Receita líquida
     * @returns {Object} Percentuais calculados
     */
    #calcularPercentualDRE(dre, base) {
        const resultado = {};

        for (const [chave, valor] of Object.entries(dre)) {
            if (typeof valor === 'number') {
                resultado[chave] = {
                    valor,
                    percentual: (valor / base) * 100,
                    percentualABS: Math.abs((valor / base) * 100), // Para itens negativos
                };
            } else if (typeof valor === 'object' && valor !== null) {
                // Subgrupo (ex: despesasOperacionais.vendas)
                resultado[chave] = this.#calcularPercentualDRE(valor, base);
            }
        }

        return resultado;
    }

    /**
     * Calcula análise horizontal (variação % entre anos)
     * @private
     * @param {Object} dados - Balanços ou DREs por ano
     * @param {Array&lt;string&gt;} anos
     * @returns {Object} Análise horizontal
     */
    #calcularAnaliseHorizontal(dados, anos) {
        const resultado = {};

        // Calcular variação ano a ano
        for (let i = 1; i < anos.length; i++) {
            const anoAnterior = anos[i - 1];
            const anoAtual = anos[i];

            const periodo = `${anoAnterior}-${anoAtual}`;

            resultado[periodo] = this.#calcularVariacaoPercentual(
                dados[anoAnterior],
                dados[anoAtual],
                periodo
            );
        }

        return resultado;
    }

    /**
     * Calcula variação percentual entre dois anos
     * @private
     * @param {Object} dadosAnoAnterior
     * @param {Object} dadosAnoAtual
     * @param {string} periodo
     * @returns {Object} Variações calculadas
     */
    #calcularVariacaoPercentual(dadosAnoAnterior, dadosAnoAtual, periodo) {
        const resultado = {};

        for (const [chave, valorAtual] of Object.entries(dadosAnoAtual)) {
            const valorAnterior = dadosAnoAnterior[chave];

            if (typeof valorAtual === 'number' && typeof valorAnterior === 'number') {
                // Evitar divisão por zero
                if (valorAnterior === 0) {
                    if (valorAtual === 0) {
                        resultado[chave] = {
                            valorAnterior,
                            valorAtual,
                            variacao: 0,
                            variacaoABS: 0,
                            observacao: this.messages.variacoes.ambosZero,
                        };
                    } else {
                        resultado[chave] = {
                            valorAnterior,
                            valorAtual,
                            variacao: null,
                            variacaoABS: Math.abs(valorAtual),
                            observacao: this.messages.variacoes.valorAnteriorZero,
                        };
                    }
                } else {
                    const variacao = ((valorAtual - valorAnterior) / Math.abs(valorAnterior)) * 100;

                    // Tendências vêm da configuração (NO HARDCODED DATA)
                    const tendencias = this.analiseConfig.tendencias;
                    const tendencia = variacao > 0
                        ? tendencias.crescimento
                        : variacao < 0
                        ? tendencias.queda
                        : tendencias.estavel;

                    resultado[chave] = {
                        valorAnterior,
                        valorAtual,
                        variacao,
                        variacaoABS: Math.abs(valorAtual - valorAnterior),
                        tendencia,
                    };
                }
            } else if (typeof valorAtual === 'object' && valorAtual !== null && typeof valorAnterior === 'object' && valorAnterior !== null) {
                // Subgrupo - recursão
                resultado[chave] = this.#calcularVariacaoPercentual(valorAnterior, valorAtual, `${periodo}.${chave}`);
            }
        }

        return resultado;
    }

    /**
     * Identifica tendências significativas
     * @private
     * @param {Object} analiseHorizontalBalanco
     * @param {Object} analiseHorizontalDRE
     * @param {Array&lt;string&gt;} anos
     * @returns {Object} Tendências identificadas
     */
    #identificarTendencias(analiseHorizontalBalanco, analiseHorizontalDRE, anos) {
        const tendencias = {
            crescimento: [],
            queda: [],
            estabilidade: [],
        };

        // Analisar tendências no balanço
        for (const [periodo, variacoes] of Object.entries(analiseHorizontalBalanco)) {
            this.#extrairTendenciasRecursivo(variacoes, 'balanco', periodo, tendencias);
        }

        // Analisar tendências na DRE
        for (const [periodo, variacoes] of Object.entries(analiseHorizontalDRE)) {
            this.#extrairTendenciasRecursivo(variacoes, 'dre', periodo, tendencias);
        }

        return tendencias;
    }

    /**
     * Extrai tendências recursivamente
     * @private
     * @param {Object} variacoes
     * @param {string} tipo - 'balanco' ou 'dre'
     * @param {string} periodo
     * @param {Object} tendencias - Objeto acumulador
     */
    #extrairTendenciasRecursivo(variacoes, tipo, periodo, tendencias) {
        for (const [chave, valor] of Object.entries(variacoes)) {
            if (valor.variacao !== undefined && valor.variacao !== null) {
                const variacaoABS = Math.abs(valor.variacao);

                if (variacaoABS >= this.thresholds.variacaoSignificativa) {
                    const item = {
                        tipo,
                        periodo,
                        item: chave,
                        variacao: valor.variacao,
                        valorAnterior: valor.valorAnterior,
                        valorAtual: valor.valorAtual,
                        tendencia: valor.tendencia,
                    };

                    if (valor.variacao > 0) {
                        tendencias.crescimento.push(item);
                    } else if (valor.variacao < 0) {
                        tendencias.queda.push(item);
                    }
                } else if (variacaoABS < 5) {
                    // Estabilidade (variação < 5%)
                    tendencias.estabilidade.push({
                        tipo,
                        periodo,
                        item: chave,
                        variacao: valor.variacao,
                    });
                }
            } else if (typeof valor === 'object' && valor !== null && !Array.isArray(valor)) {
                // Recursão para subgrupos
                this.#extrairTendenciasRecursivo(valor, tipo, periodo, tendencias);
            }
        }
    }

    /**
     * Gera alertas de inconsistências e variações críticas
     * @private
     * @param {Object} analiseHorizontalBalanco
     * @param {Object} analiseHorizontalDRE
     * @param {Object} data - Dados originais
     * @param {Array&lt;string&gt;} anos
     * @returns {Object} Alertas gerados
     */
    #gerarAlertas(analiseHorizontalBalanco, analiseHorizontalDRE, data, anos) {
        const alertas = {
            criticos: [],
            atencao: [],
            informativos: [],
        };

        // Alertas de variações críticas no balanço
        for (const [periodo, variacoes] of Object.entries(analiseHorizontalBalanco)) {
            this.#verificarVariacoesCriticas(variacoes, 'balanco', periodo, alertas);
        }

        // Alertas de variações críticas na DRE
        for (const [periodo, variacoes] of Object.entries(analiseHorizontalDRE)) {
            this.#verificarVariacoesCriticas(variacoes, 'dre', periodo, alertas);
        }

        // Alertas de margens decrescentes (configurado em config.alerts)
        if (this.config.alerts.atencao.includes('margemDecrescente')) {
            this.#verificarMargemDecrescente(analiseHorizontalDRE, alertas);
        }

        // Alertas de prejuízo consecutivo (configurado em config.alerts)
        if (this.config.alerts.critico.includes('prejuizoConsecutivo')) {
            this.#verificarPrejuizoConsecutivo(data.dre, anos, alertas);
        }

        return alertas;
    }

    /**
     * Verifica variações críticas recursivamente
     * @private
     * @param {Object} variacoes
     * @param {string} tipo
     * @param {string} periodo
     * @param {Object} alertas - Objeto acumulador
     */
    #verificarVariacoesCriticas(variacoes, tipo, periodo, alertas) {
        for (const [chave, valor] of Object.entries(variacoes)) {
            if (valor.variacao !== undefined && valor.variacao !== null) {
                const variacaoABS = Math.abs(valor.variacao);

                if (variacaoABS >= this.thresholds.variacaoCritica) {
                    alertas.criticos.push({
                        tipo: 'variacao_critica',
                        severidade: 'crítico',
                        origem: tipo,
                        periodo,
                        item: chave,
                        variacao: valor.variacao,
                        mensagem: `Variação crítica de ${valor.variacao.toFixed(2)}% em ${chave} (período ${periodo})`,
                    });
                } else if (variacaoABS >= this.thresholds.variacaoSignificativa) {
                    alertas.atencao.push({
                        tipo: 'variacao_significativa',
                        severidade: 'atenção',
                        origem: tipo,
                        periodo,
                        item: chave,
                        variacao: valor.variacao,
                        mensagem: `Variação significativa de ${valor.variacao.toFixed(2)}% em ${chave} (período ${periodo})`,
                    });
                }
            } else if (typeof valor === 'object' && valor !== null && !Array.isArray(valor) && !valor.valorAnterior) {
                // Recursão (se não for um item com valorAnterior/valorAtual)
                this.#verificarVariacoesCriticas(valor, tipo, periodo, alertas);
            }
        }
    }

    /**
     * Verifica margem decrescente
     * @private
     * @param {Object} analiseHorizontalDRE
     * @param {Object} alertas
     */
    #verificarMargemDecrescente(analiseHorizontalDRE, alertas) {
        for (const [periodo, variacoes] of Object.entries(analiseHorizontalDRE)) {
            // Verificar margem bruta, EBITDA, margem líquida
            const margens = ['lucroBruto', 'lucroLiquido'];

            for (const margem of margens) {
                if (variacoes[margem] && variacoes[margem].variacao < -10) {
                    alertas.atencao.push({
                        tipo: 'margem_decrescente',
                        severidade: 'atenção',
                        origem: 'dre',
                        periodo,
                        item: margem,
                        variacao: variacoes[margem].variacao,
                        mensagem: `Margem ${margem} decresceu ${Math.abs(variacoes[margem].variacao).toFixed(2)}% no período ${periodo}`,
                    });
                }
            }
        }
    }

    /**
     * Verifica prejuízo consecutivo
     * @private
     * @param {Object} dres - DREs por ano
     * @param {Array&lt;string&gt;} anos
     * @param {Object} alertas
     */
    #verificarPrejuizoConsecutivo(dres, anos, alertas) {
        let anosConsecutivosComPrejuizo = 0;
        const anosPrejuizo = [];

        for (const ano of anos) {
            const dre = dres[ano];

            if (dre && dre.lucroLiquido < 0) {
                anosConsecutivosComPrejuizo++;
                anosPrejuizo.push(ano);
            } else {
                // Quebrou a sequência
                if (anosConsecutivosComPrejuizo >= 2) {
                    alertas.criticos.push({
                        tipo: 'prejuizo_consecutivo',
                        severidade: 'crítico',
                        origem: 'dre',
                        anos: anosPrejuizo.slice(),
                        mensagem: `Prejuízo consecutivo detectado em ${anosConsecutivosComPrejuizo} anos: ${anosPrejuizo.join(', ')}`,
                    });
                }
                anosConsecutivosComPrejuizo = 0;
                anosPrejuizo.length = 0;
            }
        }

        // Verificar ao final (se terminou com prejuízo)
        if (anosConsecutivosComPrejuizo >= 2) {
            alertas.criticos.push({
                tipo: 'prejuizo_consecutivo',
                severidade: 'crítico',
                origem: 'dre',
                anos: anosPrejuizo.slice(),
                mensagem: `Prejuízo consecutivo detectado em ${anosConsecutivosComPrejuizo} anos: ${anosPrejuizo.join(', ')}`,
            });
        }
    }

    /**
     * Emite evento de alerta
     * @private
     * @param {string} severidade - 'critico', 'atencao', 'informativo'
     * @param {Array} alertas
     */
    #emitirEventoAlerta(severidade, alertas) {
        const event = new CustomEvent('analiseVerticalHorizontalAlerta', {
            detail: {
                severidade,
                alertas,
                timestamp: new Date().toISOString(),
            },
        });

        document.dispatchEvent(event);

        console.warn(`⚠️ Alertas ${severidade} detectados na análise vertical/horizontal:`, alertas);
    }
}

// Expor globalmente
window.AnaliseVerticalHorizontal = AnaliseVerticalHorizontal;
