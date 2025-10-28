/**
 * IntegrationOrchestrator
 *
 * Orquestrador central de análises financeiras.
 * Coordena cálculos de AH, AV e Indicadores de forma integrada.
 *
 * Responsabilidades:
 * - Carregar todas as configs necessárias
 * - Instanciar todos os calculadores
 * - Executar cálculos na sequência correta
 * - Agregar resultados em estrutura unificada
 * - Tratamento de erros centralizado
 *
 * Arquitetura: NO FALLBACKS
 * - Exceções explícitas quando componentes faltam
 * - Validações rigorosas em cada etapa
 * - Logs detalhados de progresso
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

import AnaliseHorizontalCalculator from '../calculators/analise-horizontal-calculator.js';
import AnaliseVerticalCalculator from '../calculators/analise-vertical-calculator.js';
import IndicadoresCalculator from '../calculators/indicadores-calculator.js';
import AnalysisRenderer from '../renderers/analysis-renderer.js';

export class IntegrationOrchestrator {
    /**
     * Configurações carregadas
     * @private
     */
    #configs = {
        analiseHorizontal: null,
        analiseVertical: null,
        indicadores: null,
        renderer: null
    };

    /**
     * Calculadores instanciados
     * @private
     */
    #calculadores = {
        analiseHorizontal: null,
        analiseVertical: null,
        indicadores: null
    };

    /**
     * Estado de inicialização
     * @private
     */
    #inicializado = false;

    /**
     * Inicializa orquestrador (carrega configs e instancia calculadores)
     * @param {Object} configPaths - Caminhos opcionais para configs
     * @throws {Error} Se inicialização falhar
     */
    async inicializar(configPaths = {}) {
        console.log('[IntegrationOrchestrator] 🚀 Iniciando...');

        const paths = {
            analiseHorizontal: configPaths.analiseHorizontal || '/config/analise-horizontal-config.json',
            analiseVertical: configPaths.analiseVertical || '/config/analise-vertical-config.json',
            indicadores: configPaths.indicadores || '/config/indicadores-config.json',
            renderer: configPaths.renderer || '/config/analysis-renderer-config.json'
        };

        try {
            // STEP 1: Carregar todas as configs em paralelo
            console.log('[IntegrationOrchestrator] 📦 Carregando configs...');
            await this.#carregarConfigs(paths);

            // STEP 2: Instanciar calculadores
            console.log('[IntegrationOrchestrator] 🔧 Instanciando calculadores...');
            this.#instanciarCalculadores();

            // STEP 3: Carregar config do Renderer
            console.log('[IntegrationOrchestrator] 🎨 Carregando config do Renderer...');
            await AnalysisRenderer.carregarConfig(paths.renderer);

            this.#inicializado = true;
            console.log('[IntegrationOrchestrator] ✅ Inicialização completa');

        } catch (error) {
            console.error('[IntegrationOrchestrator] ❌ Falha na inicialização:', error);
            throw new Error(`IntegrationOrchestrator: Falha na inicialização - ${error.message}`);
        }
    }

    /**
     * Carrega todas as configurações
     * @private
     */
    async #carregarConfigs(paths) {
        const promises = Object.entries(paths).map(async ([key, path]) => {
            try {
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const config = await response.json();
                this.#configs[key] = config;
                console.log(`   ✓ Config ${key} carregada de ${path}`);
            } catch (error) {
                throw new Error(`Falha ao carregar config ${key} de ${path}: ${error.message}`);
            }
        });

        await Promise.all(promises);
    }

    /**
     * Instancia todos os calculadores
     * @private
     * @throws {Error} Se calculadores não disponíveis
     */
    #instanciarCalculadores() {
        // Validar que configs foram carregadas
        if (!this.#configs.analiseHorizontal || !this.#configs.analiseVertical || !this.#configs.indicadores) {
            throw new Error('IntegrationOrchestrator: Configs obrigatórias não carregadas');
        }

        try {
            // Instanciar Análise Horizontal
            this.#calculadores.analiseHorizontal = new AnaliseHorizontalCalculator(
                this.#configs.analiseHorizontal
            );
            console.log('   ✓ AnaliseHorizontalCalculator instanciado');

            // Instanciar Análise Vertical
            this.#calculadores.analiseVertical = new AnaliseVerticalCalculator(
                this.#configs.analiseVertical
            );
            console.log('   ✓ AnaliseVerticalCalculator instanciado');

            // Instanciar Indicadores
            this.#calculadores.indicadores = new IndicadoresCalculator(
                this.#configs.indicadores
            );
            console.log('   ✓ IndicadoresCalculator instanciado');

        } catch (error) {
            throw new Error(`Falha ao instanciar calculadores: ${error.message}`);
        }
    }

    /**
     * Valida se orquestrador foi inicializado
     * @private
     * @throws {Error} Se não inicializado
     */
    #validarInicializacao() {
        if (!this.#inicializado) {
            throw new Error(
                'IntegrationOrchestrator: Não inicializado - execute inicializar() primeiro'
            );
        }
    }

    /**
     * Executa todos os cálculos de análise
     * @param {Object} dados - Dados extraídos do FormDataAdapter
     * @returns {Object} Resultados consolidados de todas as análises
     * @throws {Error} Se dados inválidos ou cálculos falharem
     */
    calcularAnalises(dados) {
        this.#validarInicializacao();
        console.log('[IntegrationOrchestrator] 📊 Iniciando cálculos...');

        // Validar dados recebidos
        this.#validarDados(dados);

        const resultados = {
            timestamp: Date.now(),
            metadata: dados.metadata,
            analises: {}
        };

        try {
            // ====================================================================
            // ANÁLISE HORIZONTAL (Balanço e DRE separadamente)
            // ====================================================================
            console.log('[IntegrationOrchestrator] 📈 Calculando Análise Horizontal...');

            resultados.analises.analiseHorizontal = {
                balanco: this.#calculadores.analiseHorizontal.calcular(
                    dados.balanco,
                    'balanco'
                ),
                dre: this.#calculadores.analiseHorizontal.calcular(
                    dados.dre,
                    'dre'
                )
            };

            console.log('   ✓ Análise Horizontal completa');

            // ====================================================================
            // ANÁLISE VERTICAL (Cada período separadamente)
            // ====================================================================
            console.log('[IntegrationOrchestrator] 📊 Calculando Análise Vertical...');

            resultados.analises.analiseVertical = {
                balanco: [],
                dre: []
            };

            // Calcular AV para cada período do Balanço
            dados.balanco.periodos.forEach((periodo, idx) => {
                const resultado = this.#calculadores.analiseVertical.calcular(
                    periodo,
                    'balanco'
                );
                resultados.analises.analiseVertical.balanco.push({
                    periodo: idx + 1,
                    ...resultado
                });
            });

            // Calcular AV para cada período da DRE
            dados.dre.periodos.forEach((periodo, idx) => {
                const resultado = this.#calculadores.analiseVertical.calcular(
                    periodo,
                    'dre'
                );
                resultados.analises.analiseVertical.dre.push({
                    periodo: idx + 1,
                    ...resultado
                });
            });

            console.log('   ✓ Análise Vertical completa');

            // ====================================================================
            // INDICADORES FINANCEIROS (Último período com complementares)
            // ====================================================================
            console.log('[IntegrationOrchestrator] 💹 Calculando Indicadores...');

            // Usar último período disponível (geralmente período 4)
            const ultimoPeriodoBalanco = dados.balanco.periodos[dados.balanco.periodos.length - 1];
            const ultimoPeriodoDRE = dados.dre.periodos[dados.dre.periodos.length - 1];

            // Indicadores de Balanço (com DRE complementar para ROE/ROA)
            resultados.analises.indicadores = {
                balanco: this.#calculadores.indicadores.calcular(
                    ultimoPeriodoBalanco,
                    'balanco',
                    { dre: ultimoPeriodoDRE }
                ),
                dre: this.#calculadores.indicadores.calcular(
                    ultimoPeriodoDRE,
                    'dre'
                )
            };

            console.log('   ✓ Indicadores completos');

            // ====================================================================
            // Logging de Resumo
            // ====================================================================
            console.log('[IntegrationOrchestrator] ✅ Todos os cálculos concluídos');
            console.log(`   ├─ AH Balanço: ${Object.keys(resultados.analises.analiseHorizontal.balanco.variacoesPeriodos || {}).length} contas`);
            console.log(`   ├─ AH DRE: ${Object.keys(resultados.analises.analiseHorizontal.dre.variacoesPeriodos || {}).length} contas`);
            console.log(`   ├─ AV Balanço: ${resultados.analises.analiseVertical.balanco.length} períodos`);
            console.log(`   ├─ AV DRE: ${resultados.analises.analiseVertical.dre.length} períodos`);
            console.log(`   ├─ Indicadores Balanço: ${Object.keys(resultados.analises.indicadores.balanco).length} indicadores`);
            console.log(`   └─ Indicadores DRE: ${Object.keys(resultados.analises.indicadores.dre).length} indicadores`);

            return resultados;

        } catch (error) {
            console.error('[IntegrationOrchestrator] ❌ Erro nos cálculos:', error);
            throw new Error(`Falha nos cálculos de análise: ${error.message}`);
        }
    }

    /**
     * Renderiza resultados completos
     * @param {Object} resultados - Resultados retornados por calcularAnalises()
     * @throws {Error} Se renderização falhar
     */
    renderizarAnalises(resultados) {
        this.#validarInicializacao();
        console.log('[IntegrationOrchestrator] 🎨 Renderizando análises...');

        try {
            // Renderizar Análise Horizontal (Balanço + DRE combinados)
            const ahCombinado = this.#combinarResultadosAH(
                resultados.analises.analiseHorizontal.balanco,
                resultados.analises.analiseHorizontal.dre
            );
            AnalysisRenderer.renderAnaliseHorizontal(ahCombinado, 'ah-results');
            console.log('   ✓ Análise Horizontal renderizada');

            // Renderizar Análise Vertical (Último período do Balanço + DRE)
            const avBalanco = resultados.analises.analiseVertical.balanco[
                resultados.analises.analiseVertical.balanco.length - 1
            ];
            const avDRE = resultados.analises.analiseVertical.dre[
                resultados.analises.analiseVertical.dre.length - 1
            ];

            AnalysisRenderer.renderAnaliseVertical(avBalanco, 'av-results');
            console.log('   ✓ Análise Vertical renderizada');

            // Renderizar Indicadores (Balanço + DRE combinados)
            const indicadoresCombinados = {
                ...resultados.analises.indicadores.balanco,
                ...resultados.analises.indicadores.dre
            };
            AnalysisRenderer.renderIndicadores(indicadoresCombinados, 'indicadores');
            console.log('   ✓ Indicadores renderizados');

            console.log('[IntegrationOrchestrator] ✅ Renderização completa');

        } catch (error) {
            console.error('[IntegrationOrchestrator] ❌ Erro na renderização:', error);
            throw new Error(`Falha na renderização: ${error.message}`);
        }
    }

    /**
     * Combina resultados de AH de Balanço e DRE
     * @private
     */
    #combinarResultadosAH(ahBalanco, ahDRE) {
        return {
            tipo: 'balanco+dre',
            periodos: ahBalanco.periodos,
            variacoesPeriodos: {
                ...ahBalanco.variacoesPeriodos,
                ...ahDRE.variacoesPeriodos
            },
            cagr: {
                ...ahBalanco.cagr,
                ...ahDRE.cagr
            },
            tendencias: {
                ...ahBalanco.tendencias,
                ...ahDRE.tendencias
            },
            alertas: [
                ...ahBalanco.alertas,
                ...ahDRE.alertas
            ].sort((a, b) => {
                const ordem = { crítico: 1, aviso: 2, info: 3 };
                return ordem[a.nivel] - ordem[b.nivel];
            }),
            timestamp: Date.now()
        };
    }

    /**
     * Valida dados recebidos
     * @private
     * @throws {Error} Se dados inválidos
     */
    #validarDados(dados) {
        if (!dados || typeof dados !== 'object') {
            throw new Error('IntegrationOrchestrator: dados deve ser um objeto válido');
        }

        // Validar estrutura de Balanço
        if (!dados.balanco || !Array.isArray(dados.balanco.periodos)) {
            throw new Error('IntegrationOrchestrator: dados.balanco.periodos obrigatório');
        }

        if (dados.balanco.periodos.length < 2) {
            throw new Error(
                'IntegrationOrchestrator: mínimo de 2 períodos necessário para análises ' +
                `(recebido ${dados.balanco.periodos.length})`
            );
        }

        // Validar estrutura de DRE
        if (!dados.dre || !Array.isArray(dados.dre.periodos)) {
            throw new Error('IntegrationOrchestrator: dados.dre.periodos obrigatório');
        }

        if (dados.dre.periodos.length < 2) {
            throw new Error(
                'IntegrationOrchestrator: mínimo de 2 períodos necessário para análises DRE ' +
                `(recebido ${dados.dre.periodos.length})`
            );
        }

        // Validar que períodos têm dados
        dados.balanco.periodos.forEach((periodo, idx) => {
            if (!periodo || Object.keys(periodo).length === 0) {
                throw new Error(
                    `IntegrationOrchestrator: Balanço período ${idx + 1} vazio - nenhuma conta encontrada`
                );
            }
        });

        dados.dre.periodos.forEach((periodo, idx) => {
            if (!periodo || Object.keys(periodo).length === 0) {
                throw new Error(
                    `IntegrationOrchestrator: DRE período ${idx + 1} vazio - nenhuma conta encontrada`
                );
            }
        });

        console.log('✓ Validação de dados: OK');
    }

    /**
     * Retorna estado de inicialização
     * @returns {boolean}
     */
    estaInicializado() {
        return this.#inicializado;
    }

    /**
     * Retorna configs carregadas (debug)
     * @returns {Object}
     */
    getConfigs() {
        return { ...this.#configs };
    }

    /**
     * Informações de debug
     * @returns {Object}
     */
    debug() {
        return {
            className: 'IntegrationOrchestrator',
            version: '1.0.0',
            inicializado: this.#inicializado,
            configsCarregadas: Object.keys(this.#configs).filter(k => this.#configs[k] !== null),
            calculadoresInstanciados: Object.keys(this.#calculadores).filter(k => this.#calculadores[k] !== null)
        };
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.IntegrationOrchestrator = IntegrationOrchestrator;
}

export default IntegrationOrchestrator;

console.log('✅ IntegrationOrchestrator carregado');
