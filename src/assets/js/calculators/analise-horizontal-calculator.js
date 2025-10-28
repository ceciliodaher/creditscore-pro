/**
 * analise-horizontal-calculator.js
 * Calculador de Análise Horizontal (Temporal)
 *
 * FASE 1: Cálculo de variações temporais, CAGR e identificação de tendências
 * - Calcula variações entre períodos (P1→P2, P2→P3, P3→P4)
 * - Calcula CAGR (Taxa de Crescimento Composta Anual)
 * - Identifica tendências (crescente, decrescente, estável)
 * - Gera alertas críticos baseados em thresholds
 * - NO FALLBACKS: Validação rigorosa, exceções explícitas
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

class AnaliseHorizontalCalculator {
    /**
     * @param {Object} config - Configuração obrigatória de thresholds (de analise-horizontal-config.json)
     * @throws {Error} Se config não fornecido ou inválido
     */
    constructor(config) {
        // NO FALLBACKS - config é obrigatório
        if (!config) {
            throw new Error(
                'AnaliseHorizontalCalculator: config obrigatório não fornecido. ' +
                'Carregue config/analise-horizontal-config.json'
            );
        }

        // Validar estrutura do config
        this.#validarConfig(config);

        this.config = config;
        console.log('✅ AnaliseHorizontalCalculator inicializado');
    }

    /**
     * Valida estrutura do config
     * @private
     * @throws {Error} Se config inválido
     */
    #validarConfig(config) {
        const camposObrigatorios = ['thresholds', 'periodos', 'confianca', 'alertas'];
        const faltando = camposObrigatorios.filter(campo => !config[campo]);

        if (faltando.length > 0) {
            throw new Error(
                `AnaliseHorizontalCalculator: config incompleto. Campos faltando: ${faltando.join(', ')}`
            );
        }

        // Validar thresholds
        if (!config.thresholds.variacaoSignificativa || !config.thresholds.variacaoCritica || !config.thresholds.tendenciaEstavel) {
            throw new Error('AnaliseHorizontalCalculator: config.thresholds incompleto');
        }

        // Validar periodos
        if (!config.periodos.minimo || !config.periodos.maximo) {
            throw new Error('AnaliseHorizontalCalculator: config.periodos incompleto');
        }
    }

    /**
     * Método principal de cálculo
     * @param {Object} dados - Dados financeiros com múltiplos períodos
     * @param {Array} dados.periodos - Array com períodos de dados
     * @param {string} tipo - 'balanco' ou 'dre'
     * @returns {Object} Resultado com variações, CAGR, tendências e alertas
     * @throws {Error} Se dados inválidos
     */
    calcular(dados, tipo = 'balanco') {
        console.log('📊 [AnaliseHorizontalCalculator] Iniciando cálculos de AH');

        // Validação obrigatória - NO FALLBACKS
        this.#validarDados(dados);

        try {
            const periodos = dados.periodos;

            // STEP 1: Calcular variações entre períodos consecutivos
            const variacoesPeriodos = this.#calcularVariacoesPeriodos(periodos);

            // STEP 2: Calcular CAGR (taxa composta sobre todo o período)
            const cagr = this.#calcularCAGR(periodos);

            // STEP 3: Identificar tendências
            const tendencias = this.#identificarTendencias(variacoesPeriodos);

            // STEP 4: Gerar alertas
            const alertas = this.#gerarAlertas(variacoesPeriodos, tendencias, tipo);

            const resultado = {
                tipo: tipo,
                periodos: periodos.length,
                variacoesPeriodos,
                cagr,
                tendencias,
                alertas,
                timestamp: Date.now()
            };

            console.log('✅ [AnaliseHorizontalCalculator] Cálculos concluídos');
            console.log(`   ├─ Variações calculadas: ${Object.keys(variacoesPeriodos).length} contas`);
            console.log(`   ├─ CAGR calculado: ${Object.keys(cagr).length} contas`);
            console.log(`   ├─ Tendências identificadas: ${Object.keys(tendencias).length} contas`);
            console.log(`   └─ Alertas gerados: ${alertas.length}`);

            return resultado;

        } catch (error) {
            console.error('❌ [AnaliseHorizontalCalculator] Erro nos cálculos:', error);
            throw new Error(`Falha no cálculo de Análise Horizontal: ${error.message}`);
        }
    }

    // ====================================================================
    // Validação de Dados (NO FALLBACKS)
    // ====================================================================

    /**
     * Valida dados de entrada
     * @private
     * @throws {Error} Se dados inválidos
     */
    #validarDados(dados) {
        if (!dados || typeof dados !== 'object') {
            throw new Error('AnaliseHorizontalCalculator: dados deve ser um objeto válido');
        }

        if (!Array.isArray(dados.periodos)) {
            throw new Error('AnaliseHorizontalCalculator: dados.periodos deve ser um array');
        }

        if (dados.periodos.length < this.config.periodos.minimo) {
            throw new Error(
                `AnaliseHorizontalCalculator: mínimo de ${this.config.periodos.minimo} períodos necessário ` +
                `(recebido ${dados.periodos.length})`
            );
        }

        if (dados.periodos.length > this.config.periodos.maximo) {
            throw new Error(
                `AnaliseHorizontalCalculator: máximo de ${this.config.periodos.maximo} períodos permitido ` +
                `(recebido ${dados.periodos.length})`
            );
        }

        // Validar que cada período tem dados
        dados.periodos.forEach((periodo, index) => {
            if (!periodo || typeof periodo !== 'object') {
                throw new Error(
                    `AnaliseHorizontalCalculator: período ${index + 1} inválido - ` +
                    'deve ser um objeto com contas financeiras'
                );
            }

            if (Object.keys(periodo).length === 0) {
                throw new Error(
                    `AnaliseHorizontalCalculator: período ${index + 1} vazio - ` +
                    'nenhuma conta encontrada'
                );
            }
        });

        console.log(`✓ Validação OK: ${dados.periodos.length} períodos`);
    }

    // ====================================================================
    // Cálculos de Variações
    // ====================================================================

    /**
     * Calcula variações percentuais entre períodos consecutivos
     * @private
     * @param {Array} periodos - Array de períodos com dados
     * @returns {Object} Objeto com variações por conta
     * @throws {Error} Se dados de conta inválidos
     */
    #calcularVariacoesPeriodos(periodos) {
        console.log('   ├─ Calculando variações entre períodos...');

        const variacoes = {};

        // Obter todas as contas do primeiro período como referência
        const contas = Object.keys(periodos[0]);

        contas.forEach(conta => {
            variacoes[conta] = [];

            // Calcular variação de cada período para o próximo
            for (let i = 0; i < periodos.length - 1; i++) {
                const valorAtual = this.#parseValor(periodos[i][conta], `${conta} (P${i + 1})`);
                const valorProximo = this.#parseValor(periodos[i + 1][conta], `${conta} (P${i + 2})`);

                const variacao = this.#calcularVariacaoPercentual(valorAtual, valorProximo, conta, i + 1);

                variacoes[conta].push({
                    periodo: `P${i + 1}→P${i + 2}`,
                    valorAnterior: valorAtual,
                    valorAtual: valorProximo,
                    variacao: variacao,
                    variacaoAbsoluta: valorProximo - valorAtual
                });
            }
        });

        return variacoes;
    }

    /**
     * Parse de valor com validação rigorosa (NO FALLBACKS)
     * @private
     * @param {*} valor
     * @param {string} contexto - Para mensagem de erro
     * @returns {number}
     * @throws {Error} Se valor inválido
     */
    #parseValor(valor, contexto) {
        // Aceitar null/undefined como 0 (conta pode não existir em algum período)
        if (valor === null || valor === undefined) {
            return 0;
        }

        const parsed = parseFloat(valor);

        if (isNaN(parsed)) {
            throw new Error(
                `AnaliseHorizontalCalculator: valor inválido em ${contexto} - ` +
                `"${valor}" não é um número válido`
            );
        }

        return parsed;
    }

    /**
     * Calcula variação percentual entre dois valores
     * @private
     * @param {number} valorAnterior
     * @param {number} valorAtual
     * @param {string} conta - Para logging
     * @param {number} periodo - Para logging
     * @returns {number} Variação em decimal (0.25 = 25%)
     */
    #calcularVariacaoPercentual(valorAnterior, valorAtual, conta, periodo) {
        // Caso especial: se anterior é zero
        if (valorAnterior === 0) {
            if (valorAtual === 0) {
                return 0;
            }
            // Se anterior zero e atual não-zero, considera crescimento/queda de 100%
            console.warn(
                `⚠️ [AH] ${conta} (P${periodo}): valor anterior zero, atual ${valorAtual.toFixed(2)} - ` +
                'considerando variação de 100%'
            );
            return valorAtual > 0 ? 1.0 : -1.0;
        }

        return (valorAtual - valorAnterior) / Math.abs(valorAnterior);
    }

    // ====================================================================
    // Cálculo de CAGR
    // ====================================================================

    /**
     * Calcula CAGR (Compound Annual Growth Rate)
     * @private
     * @param {Array} periodos - Array de períodos
     * @returns {Object} CAGR por conta
     */
    #calcularCAGR(periodos) {
        console.log('   ├─ Calculando CAGR...');

        const cagr = {};
        const contas = Object.keys(periodos[0]);

        const valorInicial = periodos[0];
        const valorFinal = periodos[periodos.length - 1];
        const numPeriodos = periodos.length - 1;

        contas.forEach(conta => {
            const inicial = this.#parseValor(valorInicial[conta], `${conta} (inicial)`);
            const final = this.#parseValor(valorFinal[conta], `${conta} (final)`);

            // Cálculo CAGR: ((Valor Final / Valor Inicial) ^ (1 / Número de Períodos)) - 1
            let cagrValue = 0;
            let metodo = 'zero';

            if (inicial !== 0 && final > 0 && inicial > 0) {
                // Caso padrão: ambos positivos
                cagrValue = Math.pow(final / inicial, 1 / numPeriodos) - 1;
                metodo = 'padrao';
            } else if (inicial !== 0 && final > 0 && inicial < 0) {
                // Inicial negativo, final positivo (recuperação)
                cagrValue = 1.0;
                metodo = 'recuperacao';
                console.warn(
                    `⚠️ [CAGR] ${conta}: inicial negativo (${inicial.toFixed(2)}), ` +
                    `final positivo (${final.toFixed(2)}) - considerando recuperação de 100%`
                );
            } else if (inicial === 0 && final !== 0) {
                // Inicial zero (conta nova)
                cagrValue = 1.0;
                metodo = 'conta_nova';
                console.warn(
                    `⚠️ [CAGR] ${conta}: valor inicial zero, final ${final.toFixed(2)} - ` +
                    'considerando crescimento de 100%'
                );
            } else if (inicial !== 0 && final === 0) {
                // Final zero (conta zerada)
                cagrValue = -1.0;
                metodo = 'conta_zerada';
                console.warn(
                    `⚠️ [CAGR] ${conta}: inicial ${inicial.toFixed(2)}, final zero - ` +
                    'considerando queda de 100%'
                );
            }

            cagr[conta] = {
                valorInicial: inicial,
                valorFinal: final,
                periodos: numPeriodos,
                cagr: cagrValue,
                cagrAnual: cagrValue * (numPeriodos >= 2 ? (numPeriodos / 2) : 1), // Anualizar
                metodo: metodo
            };
        });

        return cagr;
    }

    // ====================================================================
    // Identificação de Tendências
    // ====================================================================

    /**
     * Identifica tendências (crescente, decrescente, estável)
     * @private
     * @param {Object} variacoesPeriodos - Variações calculadas
     * @returns {Object} Tendências por conta
     */
    #identificarTendencias(variacoesPeriodos) {
        console.log('   ├─ Identificando tendências...');

        const tendencias = {};

        Object.entries(variacoesPeriodos).forEach(([conta, variacoes]) => {
            const mediaVariacoes = this.#calcularMediaVariacoes(variacoes);
            const consistencia = this.#calcularConsistencia(variacoes);

            let tendencia = 'estável';
            let confianca = 'baixa';

            // Determinar tendência baseado na média
            if (Math.abs(mediaVariacoes) <= this.config.thresholds.tendenciaEstavel) {
                tendencia = 'estável';
            } else if (mediaVariacoes > 0) {
                tendencia = 'crescente';
            } else {
                tendencia = 'decrescente';
            }

            // Determinar confiança baseado na consistência
            if (consistencia >= this.config.confianca.alta) {
                confianca = 'alta';
            } else if (consistencia >= this.config.confianca.media) {
                confianca = 'média';
            }

            tendencias[conta] = {
                tendencia,
                confianca,
                mediaVariacoes,
                consistencia,
                variacoesPositivas: variacoes.filter(v => v.variacao > 0).length,
                variacoesNegativas: variacoes.filter(v => v.variacao < 0).length,
                variacoesEstaveis: variacoes.filter(
                    v => Math.abs(v.variacao) <= this.config.thresholds.tendenciaEstavel
                ).length
            };
        });

        return tendencias;
    }

    /**
     * Calcula média das variações
     * @private
     * @throws {Error} Se array vazio
     */
    #calcularMediaVariacoes(variacoes) {
        if (variacoes.length === 0) {
            throw new Error('AnaliseHorizontalCalculator: impossível calcular média de array vazio');
        }

        const soma = variacoes.reduce((acc, v) => acc + v.variacao, 0);
        return soma / variacoes.length;
    }

    /**
     * Calcula consistência da tendência (0-1)
     * @private
     * @throws {Error} Se array vazio
     */
    #calcularConsistencia(variacoes) {
        if (variacoes.length === 0) {
            throw new Error('AnaliseHorizontalCalculator: impossível calcular consistência de array vazio');
        }

        // Contar quantas variações seguem a mesma direção
        let positivas = 0;
        let negativas = 0;
        let estaveis = 0;

        variacoes.forEach(v => {
            if (Math.abs(v.variacao) <= this.config.thresholds.tendenciaEstavel) {
                estaveis++;
            } else if (v.variacao > 0) {
                positivas++;
            } else {
                negativas++;
            }
        });

        // Consistência = máximo de ocorrências na mesma direção / total
        const max = Math.max(positivas, negativas, estaveis);
        return max / variacoes.length;
    }

    // ====================================================================
    // Geração de Alertas
    // ====================================================================

    /**
     * Gera alertas baseados em variações e tendências
     * @private
     * @param {Object} variacoesPeriodos
     * @param {Object} tendencias
     * @param {string} tipo
     * @returns {Array} Lista de alertas
     */
    #gerarAlertas(variacoesPeriodos, tendencias, tipo) {
        console.log('   ├─ Gerando alertas...');

        if (!this.config.alertas.habilitado) {
            console.log('   └─ Alertas desabilitados no config');
            return [];
        }

        const alertas = [];

        Object.entries(variacoesPeriodos).forEach(([conta, variacoes]) => {
            variacoes.forEach(variacao => {
                const variacaoAbs = Math.abs(variacao.variacao);

                // Alerta CRÍTICO: variação >= 50%
                if (variacaoAbs >= this.config.thresholds.variacaoCritica) {
                    alertas.push({
                        nivel: 'crítico',
                        tipo: 'variacao_critica',
                        conta,
                        periodo: variacao.periodo,
                        variacao: variacao.variacao,
                        mensagem: `Variação crítica de ${(variacao.variacao * 100).toFixed(1)}% em ${conta} (${variacao.periodo})`
                    });
                }
                // Alerta WARNING: variação >= 20%
                else if (variacaoAbs >= this.config.thresholds.variacaoSignificativa) {
                    alertas.push({
                        nivel: 'aviso',
                        tipo: 'variacao_significativa',
                        conta,
                        periodo: variacao.periodo,
                        variacao: variacao.variacao,
                        mensagem: `Variação significativa de ${(variacao.variacao * 100).toFixed(1)}% em ${conta} (${variacao.periodo})`
                    });
                }
            });

            // Alerta de tendência consistente
            const tendencia = tendencias[conta];
            if (tendencia.confianca === 'alta' && tendencia.tendencia !== 'estável') {
                alertas.push({
                    nivel: 'info',
                    tipo: 'tendencia_consistente',
                    conta,
                    tendencia: tendencia.tendencia,
                    confianca: tendencia.confianca,
                    mensagem: `Tendência ${tendencia.tendencia} consistente em ${conta} (confiança: ${tendencia.confianca})`
                });
            }
        });

        // Ordenar alertas por criticidade
        alertas.sort((a, b) => {
            const ordem = { crítico: 1, aviso: 2, info: 3 };
            return ordem[a.nivel] - ordem[b.nivel];
        });

        return alertas;
    }

    // ====================================================================
    // Métodos Auxiliares
    // ====================================================================

    /**
     * Retorna configuração atual
     * @returns {Object}
     */
    getConfig() {
        return { ...this.config };
    }

    /**
     * Informações de debug
     * @returns {Object}
     */
    debug() {
        return {
            className: 'AnaliseHorizontalCalculator',
            version: '1.0.0',
            config: this.config
        };
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.AnaliseHorizontalCalculator = AnaliseHorizontalCalculator;
}

// Export para ES6 modules
export default AnaliseHorizontalCalculator;

console.log('✅ AnaliseHorizontalCalculator carregado');
