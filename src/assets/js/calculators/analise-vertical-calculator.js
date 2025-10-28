/**
 * analise-vertical-calculator.js
 * Calculador de Análise Vertical (Composição Percentual)
 *
 * FASE 1: Cálculo de percentuais sobre base e validação hierárquica completa
 * - Calcula percentual de cada conta sobre a base (Ativo Total ou Receita Líquida)
 * - Valida que totalizadores parciais somam 100% ± tolerância
 * - Identifica concentrações críticas (>30%, >50%, >70%)
 * - Gera alertas de concentração e validação
 * - Suporta hierarquias de 2-3 níveis (Balanço e DRE)
 * - NO FALLBACKS: Validação rigorosa, exceções explícitas
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

class AnaliseVerticalCalculator {
    /**
     * @param {Object} config - Configuração obrigatória (de analise-vertical-config.json)
     * @throws {Error} Se config não fornecido ou inválido
     */
    constructor(config) {
        // NO FALLBACKS - config é obrigatório
        if (!config) {
            throw new Error(
                'AnaliseVerticalCalculator: config obrigatório não fornecido. ' +
                'Carregue config/analise-vertical-config.json'
            );
        }

        // Validar estrutura do config
        this.#validarConfig(config);

        this.config = config;
        console.log('✅ AnaliseVerticalCalculator inicializado');
    }

    /**
     * Valida estrutura do config
     * @private
     * @throws {Error} Se config inválido
     */
    #validarConfig(config) {
        const camposObrigatorios = ['bases', 'thresholds', 'alertas', 'validacoesSoma100'];
        const faltando = camposObrigatorios.filter(campo => !config[campo]);

        if (faltando.length > 0) {
            throw new Error(
                `AnaliseVerticalCalculator: config incompleto. Campos faltando: ${faltando.join(', ')}`
            );
        }

        // Validar bases
        if (!config.bases.balanco || !config.bases.dre) {
            throw new Error('AnaliseVerticalCalculator: config.bases incompleto (faltando balanco ou dre)');
        }

        // Validar thresholds
        if (!config.thresholds.concentracaoAlta || !config.thresholds.toleranciaValidacao) {
            throw new Error('AnaliseVerticalCalculator: config.thresholds incompleto');
        }

        // Validar validacoesSoma100
        if (!config.validacoesSoma100.balanco || !config.validacoesSoma100.dre) {
            throw new Error('AnaliseVerticalCalculator: config.validacoesSoma100 incompleto');
        }
    }

    /**
     * Método principal de cálculo
     * @param {Object} dados - Dados financeiros de um período
     * @param {string} tipo - 'balanco' ou 'dre'
     * @returns {Object} Resultado com percentuais, validações, concentrações e alertas
     * @throws {Error} Se dados inválidos
     */
    calcular(dados, tipo = 'balanco') {
        console.log('📊 [AnaliseVerticalCalculator] Iniciando cálculos de AV');

        // Validação obrigatória - NO FALLBACKS
        this.#validarDados(dados, tipo);

        try {
            // Obter campo base
            const baseCampo = this.config.bases[tipo].campo;
            const valorBase = this.#parseValor(dados[baseCampo], `${baseCampo} (base)`);

            if (valorBase === 0) {
                throw new Error(
                    `AnaliseVerticalCalculator: base ${baseCampo} é zero - ` +
                    'impossível calcular percentuais'
                );
            }

            // STEP 1: Calcular percentuais sobre a base principal
            const percentuais = this.#calcularPercentuais(dados, valorBase);

            // STEP 2: Validar todas as hierarquias (totalizadores parciais)
            const validacoes = this.#validarTodasHierarquias(dados, tipo);

            // STEP 3: Identificar concentrações
            const concentracoes = this.#identificarConcentracoes(percentuais);

            // STEP 4: Gerar alertas
            const alertas = this.#gerarAlertas(percentuais, concentracoes, validacoes, tipo);

            const resultado = {
                tipo: tipo,
                base: {
                    campo: baseCampo,
                    valor: valorBase,
                    label: this.config.bases[tipo].label
                },
                percentuais,
                validacoes,
                concentracoes,
                alertas,
                timestamp: Date.now()
            };

            console.log('✅ [AnaliseVerticalCalculator] Cálculos concluídos');
            console.log(`   ├─ Percentuais calculados: ${Object.keys(percentuais).length} contas`);
            console.log(`   ├─ Validações realizadas: ${validacoes.length}`);
            console.log(`   ├─ Concentrações identificadas: ${concentracoes.length}`);
            console.log(`   └─ Alertas gerados: ${alertas.length}`);

            return resultado;

        } catch (error) {
            console.error('❌ [AnaliseVerticalCalculator] Erro nos cálculos:', error);
            throw new Error(`Falha no cálculo de Análise Vertical: ${error.message}`);
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
    #validarDados(dados, tipo) {
        if (!dados || typeof dados !== 'object') {
            throw new Error('AnaliseVerticalCalculator: dados deve ser um objeto válido');
        }

        if (!['balanco', 'dre'].includes(tipo)) {
            throw new Error(
                `AnaliseVerticalCalculator: tipo "${tipo}" inválido - ` +
                'deve ser "balanco" ou "dre"'
            );
        }

        // Validar que base existe
        const baseCampo = this.config.bases[tipo].campo;
        if (!(baseCampo in dados)) {
            throw new Error(
                `AnaliseVerticalCalculator: campo base "${baseCampo}" não encontrado nos dados`
            );
        }

        console.log(`✓ Validação OK: tipo=${tipo}, base=${baseCampo}`);
    }

    /**
     * Parse de valor com validação rigorosa (NO FALLBACKS)
     * @private
     * @throws {Error} Se valor inválido
     */
    #parseValor(valor, contexto) {
        // Aceitar null/undefined como 0 (conta pode não existir)
        if (valor === null || valor === undefined) {
            return 0;
        }

        const parsed = parseFloat(valor);

        if (isNaN(parsed)) {
            throw new Error(
                `AnaliseVerticalCalculator: valor inválido em ${contexto} - ` +
                `"${valor}" não é um número válido`
            );
        }

        return parsed;
    }

    // ====================================================================
    // Cálculo de Percentuais
    // ====================================================================

    /**
     * Calcula percentual de cada conta sobre a base
     * @private
     * @param {Object} dados
     * @param {number} valorBase
     * @returns {Object} Percentuais por conta (em decimal: 0.25 = 25%)
     */
    #calcularPercentuais(dados, valorBase) {
        console.log('   ├─ Calculando percentuais sobre a base...');

        const percentuais = {};

        Object.entries(dados).forEach(([conta, valor]) => {
            const valorNumerico = this.#parseValor(valor, conta);
            const percentual = valorNumerico / valorBase;

            percentuais[conta] = {
                valor: valorNumerico,
                percentual: percentual,
                percentualFormatado: `${(percentual * 100).toFixed(2)}%`
            };
        });

        return percentuais;
    }

    // ====================================================================
    // Validação Hierárquica
    // ====================================================================

    /**
     * Valida todas as hierarquias definidas no config
     * @private
     * @param {Object} dados
     * @param {string} tipo
     * @returns {Array} Lista de validações com resultados
     */
    #validarTodasHierarquias(dados, tipo) {
        console.log('   ├─ Validando hierarquias...');

        const validacoes = [];
        const hierarquias = this.config.validacoesSoma100[tipo];

        Object.entries(hierarquias).forEach(([nomeGrupo, config]) => {
            const validacao = this.#validarGrupo(dados, config, nomeGrupo);
            validacoes.push(validacao);
        });

        return validacoes;
    }

    /**
     * Valida um grupo específico (totalizador parcial)
     * @private
     */
    #validarGrupo(dados, config, nomeGrupo) {
        const { base, componentes, descricao } = config;

        // Obter valor da base do grupo
        const valorBase = this.#parseValor(dados[base], base);

        // Se base é zero, não faz sentido validar
        if (valorBase === 0) {
            return {
                grupo: nomeGrupo,
                base: base,
                valorBase: 0,
                valido: true,
                somaPercentual: 0,
                mensagem: `Base ${base} é zero - validação não aplicável`,
                tipo: 'info'
            };
        }

        // Somar componentes
        let somaComponentes = 0;
        const componentesDetalhes = [];

        componentes.forEach(componente => {
            const valor = this.#parseValor(dados[componente], componente);
            const percentual = valor / valorBase;

            somaComponentes += valor;
            componentesDetalhes.push({
                conta: componente,
                valor: valor,
                percentual: percentual
            });
        });

        // Calcular diferença
        const diferenca = Math.abs(somaComponentes - valorBase);
        const diferencaPercentual = diferenca / valorBase;
        const tolerancia = this.config.thresholds.toleranciaValidacao;

        // Validar
        const valido = diferencaPercentual <= tolerancia;
        const somaPercentual = somaComponentes / valorBase;

        return {
            grupo: nomeGrupo,
            base: base,
            valorBase: valorBase,
            somaComponentes: somaComponentes,
            diferenca: diferenca,
            diferencaPercentual: diferencaPercentual,
            somaPercentual: somaPercentual,
            valido: valido,
            componentes: componentesDetalhes,
            descricao: descricao,
            mensagem: valido
                ? `✓ ${descricao} - Soma: ${(somaPercentual * 100).toFixed(2)}%`
                : `✗ ${descricao} - Soma: ${(somaPercentual * 100).toFixed(2)}% (esperado 100% ± ${(tolerancia * 100).toFixed(1)}%)`,
            tipo: valido ? 'sucesso' : 'erro'
        };
    }

    // ====================================================================
    // Identificação de Concentrações
    // ====================================================================

    /**
     * Identifica contas com concentração alta/crítica/extrema
     * @private
     * @param {Object} percentuais
     * @returns {Array} Lista de concentrações identificadas
     */
    #identificarConcentracoes(percentuais) {
        console.log('   ├─ Identificando concentrações...');

        const concentracoes = [];

        Object.entries(percentuais).forEach(([conta, info]) => {
            const { percentual } = info;
            const percentualAbs = Math.abs(percentual);

            let nivel = null;

            if (percentualAbs >= this.config.thresholds.concentracaoExtrema) {
                nivel = 'extrema';
            } else if (percentualAbs >= this.config.thresholds.concentracaoCritica) {
                nivel = 'crítica';
            } else if (percentualAbs >= this.config.thresholds.concentracaoAlta) {
                nivel = 'alta';
            }

            if (nivel) {
                concentracoes.push({
                    conta,
                    percentual,
                    percentualAbs,
                    nivel,
                    valor: info.valor
                });
            }
        });

        // Ordenar por percentual (maior primeiro)
        concentracoes.sort((a, b) => b.percentualAbs - a.percentualAbs);

        return concentracoes;
    }

    // ====================================================================
    // Geração de Alertas
    // ====================================================================

    /**
     * Gera alertas baseados em concentrações e validações
     * @private
     */
    #gerarAlertas(percentuais, concentracoes, validacoes, tipo) {
        console.log('   ├─ Gerando alertas...');

        if (!this.config.alertas.habilitado) {
            console.log('   └─ Alertas desabilitados no config');
            return [];
        }

        const alertas = [];

        // Alertas de concentração
        if (this.config.alertas.gerarParaConcentracao) {
            concentracoes.forEach(conc => {
                let nivelAlerta = 'info';
                if (conc.nivel === 'extrema') {
                    nivelAlerta = 'crítico';
                } else if (conc.nivel === 'crítica') {
                    nivelAlerta = 'aviso';
                }

                alertas.push({
                    nivel: nivelAlerta,
                    tipo: 'concentracao',
                    conta: conc.conta,
                    percentual: conc.percentual,
                    concentracao: conc.nivel,
                    mensagem: `Concentração ${conc.nivel} em ${conc.conta}: ${(conc.percentual * 100).toFixed(1)}%`
                });
            });
        }

        // Alertas de validação
        if (this.config.alertas.gerarParaValidacao) {
            validacoes.forEach(validacao => {
                if (!validacao.valido && validacao.tipo === 'erro') {
                    alertas.push({
                        nivel: 'aviso',
                        tipo: 'validacao_hierarquia',
                        grupo: validacao.grupo,
                        base: validacao.base,
                        somaPercentual: validacao.somaPercentual,
                        mensagem: validacao.mensagem
                    });
                }
            });
        }

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
            className: 'AnaliseVerticalCalculator',
            version: '1.0.0',
            config: this.config
        };
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.AnaliseVerticalCalculator = AnaliseVerticalCalculator;
}

// Export para ES6 modules
export default AnaliseVerticalCalculator;

console.log('✅ AnaliseVerticalCalculator carregado');
