/**
 * calculation-orchestrator.js
 * Orquestrador centralizado de cálculos
 *
 * Coordena workflow de cálculo, validation, dependencies
 * SOLID: Open/Closed Principle - extensível para novos calculators
 * DRY: Lógica de coordenação centralizada
 * NO FALLBACKS: Validação rigorosa, exceções explícitas
 *
 * @version 2.0.0
 * @date 2025-01-26
 * @changes Migrado de localStorage para IndexedDB (NO FALLBACKS)
 */

import { calculationState } from './calculation-state.js';
import { validationEngine, ValidationError } from './validation-engine.js';
import { retryIndexedDBOperation, validateIndexedDBAvailable } from '../utils/indexeddb-retry.js';

/**
 * Orquestrador de cálculos
 */
export class CalculationOrchestrator {
    #calculators = new Map();
    #history = [];
    #maxHistorySize = 10; // PRD requirement: últimos 10 cálculos
    #dbManager = null;

    /**
     * @param {Object} dbManager - Instância do CreditscoreIndexedDB (obrigatório)
     * @throws {Error} Se dbManager não fornecido
     */
    constructor(dbManager) {
        // NO FALLBACKS - dbManager é obrigatório
        if (!dbManager) {
            throw new Error('CalculationOrchestrator: dbManager obrigatório não fornecido');
        }

        // Validar que dbManager tem a API esperada
        if (typeof dbManager.save !== 'function' || typeof dbManager.get !== 'function') {
            throw new Error('CalculationOrchestrator: dbManager não possui API esperada (save, get)');
        }

        this.#dbManager = dbManager;

        // Validar IndexedDB disponível
        validateIndexedDBAvailable();

        console.log('🎯 [CalculationOrchestrator] Inicializado com IndexedDB');
        this.loadHistory();
    }

    // ====================================================================
    // Calculator Registration (Dependency Injection)
    // ====================================================================

    /**
     * Registra calculator para uso
     * @param {string} name - Nome do calculator
     * @param {Object} calculator - Instância do calculator
     */
    registerCalculator(name, calculator) {
        if (!calculator || typeof calculator.calcular !== 'function') {
            throw new Error(`Calculator '${name}' deve ter método calcular()`);
        }

        this.#calculators.set(name, calculator);
        console.log(`📝 [CalculationOrchestrator] Calculator '${name}' registrado`);
    }

    /**
     * Remove calculator
     * @param {string} name
     */
    unregisterCalculator(name) {
        this.#calculators.delete(name);
        console.log(`🗑️ [CalculationOrchestrator] Calculator '${name}' removido`);
    }

    /**
     * Verifica se calculator está registrado
     * @param {string} name
     * @returns {boolean}
     */
    hasCalculator(name) {
        return this.#calculators.has(name);
    }

    // ====================================================================
    // Main Calculation Workflow
    // ====================================================================

    /**
     * Executa workflow completo de cálculo
     * @returns {Promise<Object>} Resultados dos cálculos
     * @throws {ValidationError} Se dados inválidos
     * @throws {Error} Se cálculo falhar
     */
    async performAllCalculations() {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎯 [CalculationOrchestrator] Iniciando workflow');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

        calculationState.setCalculating(true);

        try {
            // STEP 1: Coletar dados (NO FALLBACKS)
            const data = this.#collectData();

            // STEP 2: Validar ANTES de calcular (FAIL FAST)
            const validation = await validationEngine.validate(data, 'full');

            if (!validation.isValid) {
                throw new ValidationError(
                    'Dados incompletos ou inválidos para cálculo',
                    validation.errors
                );
            }

            if (validation.warnings.length > 0) {
                console.warn('⚠️ [CalculationOrchestrator] Warnings:', validation.warnings);
            }

            // STEP 3: Executar cálculos (respeitando dependências)
            const results = await this.#executeCalculations(data);

            // STEP 4: Salvar no histórico
            this.#addToHistory({
                timestamp: new Date().toISOString(),
                data: this.#createDataSnapshot(data),
                results,
                validation
            });

            // STEP 5: Atualizar estado
            calculationState.markCalculated({
                validation,
                results,
                timestamp: new Date()
            });

            console.log('✅ [CalculationOrchestrator] Workflow concluído com sucesso');

            return results;

        } catch (error) {
            console.error('❌ [CalculationOrchestrator] Falha no workflow:', error);

            calculationState.setError(error);

            // Re-lança erro (NO SILENT FAILURES)
            throw error;

        } finally {
            calculationState.setCalculating(false);
        }
    }

    // ====================================================================
    // Data Collection (NO FALLBACKS)
    // ====================================================================

    /**
     * Coleta dados do IndexedDB
     * @private
     * @returns {Promise<Object>}
     * @throws {Error} Se dados obrigatórios faltarem
     */
    async #collectData() {
        console.log('📥 [CalculationOrchestrator] Coletando dados do IndexedDB...');

        const required = [
            'balanco',
            'dre',
            'endividamento',
            'compliance',
            'concentracao-risco'
        ];

        const data = {};
        const missing = [];

        for (const key of required) {
            try {
                // Usar retry mechanism para cada operação de leitura
                const value = await retryIndexedDBOperation(
                    () => this.#dbManager.get('calculation_data', key),
                    {
                        maxAttempts: 3,
                        baseDelay: 500,
                        operationName: `Leitura de '${key}'`
                    }
                );

                if (!value) {
                    missing.push(key);
                } else {
                    data[key] = value;
                }
            } catch (error) {
                console.error(`❌ Erro ao ler '${key}' do IndexedDB:`, error.message);
                throw new Error(
                    `Falha ao acessar dados de '${key}' no IndexedDB: ${error.message}`
                );
            }
        }

        // NO FALLBACKS - fail explicitly
        if (missing.length > 0) {
            throw new Error(
                `Dados obrigatórios não encontrados no IndexedDB: ${missing.join(', ')}`
            );
        }

        console.log('✅ Dados coletados do IndexedDB:', Object.keys(data));

        return data;
    }

    // ====================================================================
    // Calculation Execution (Dependency Graph)
    // ====================================================================

    /**
     * Executa cálculos na ordem correta (dependency graph)
     * @private
     * @returns {Promise<Object>}
     */
    async #executeCalculations(data) {
        console.log('⚙️ [CalculationOrchestrator] Executando cálculos...');

        const results = {};

        // Ordem de execução (respeita dependências)
        const executionOrder = [
            'indices',  // Índices financeiros (sem dependências)
            'scoring'   // Scoring (depende de índices)
        ];

        for (const name of executionOrder) {
            const calculator = this.#calculators.get(name);

            if (!calculator) {
                console.warn(`⚠️ Calculator '${name}' não registrado - pulando`);
                continue;
            }

            try {
                console.log(`   ├─ Executando '${name}'...`);

                // Passa dados + resultados anteriores (para dependências)
                const result = await calculator.calcular(data, results);

                results[name] = result;

                console.log(`   ├─ '${name}' concluído ✓`);

            } catch (error) {
                throw new Error(
                    `Falha no calculator '${name}': ${error.message}`
                );
            }
        }

        console.log('✅ Todos os cálculos executados');

        return results;
    }

    // ====================================================================
    // History Management (PRD Requirement)
    // ====================================================================

    /**
     * Adiciona entrada ao histórico
     * @private
     */
    #addToHistory(entry) {
        this.#history.push(entry);

        // Manter apenas últimos 10 (PRD requirement)
        if (this.#history.length > this.#maxHistorySize) {
            this.#history.shift();
        }

        this.saveHistory();

        console.log(`📝 Histórico atualizado (${this.#history.length}/${this.#maxHistorySize} entradas)`);
    }

    /**
     * Cria snapshot dos dados para histórico
     * @private
     */
    #createDataSnapshot(data) {
        return {
            balanco: {
                patrimonioLiquido: data.balanco.patrimonioLiquido,
                ativoTotal: data.balanco.ativoTotal,
                passivoTotal: data.balanco.passivoTotal
            },
            dre: {
                receitaLiquida: data.dre.receitaLiquida,
                lucroLiquido: data.dre.lucroLiquido
            }
        };
    }

    /**
     * Retorna histórico de cálculos
     * @returns {Array}
     */
    getHistory() {
        return [...this.#history]; // Retorna cópia
    }

    /**
     * Retorna última entrada do histórico
     * @returns {Object|null}
     */
    getLastHistoryEntry() {
        return this.#history.length > 0 ? this.#history[this.#history.length - 1] : null;
    }

    /**
     * Limpa histórico
     */
    clearHistory() {
        this.#history = [];
        this.saveHistory();
        console.log('🗑️ Histórico limpo');
    }

    /**
     * Salva histórico no IndexedDB
     */
    async saveHistory() {
        try {
            await retryIndexedDBOperation(
                () => this.#dbManager.save('calculation_history', {
                    timestamp: Date.now(),
                    entries: this.#history
                }),
                {
                    maxAttempts: 3,
                    baseDelay: 500,
                    operationName: 'Salvar histórico'
                }
            );

            console.log('💾 Histórico salvo no IndexedDB');
        } catch (error) {
            console.error('❌ [CalculationOrchestrator] Falha ao salvar histórico no IndexedDB:', error);
            // NO FALLBACK - erro explícito
            throw new Error(`Falha ao salvar histórico: ${error.message}`);
        }
    }

    /**
     * Carrega histórico do IndexedDB
     */
    async loadHistory() {
        try {
            const saved = await retryIndexedDBOperation(
                () => this.#dbManager.getAll('calculation_history'),
                {
                    maxAttempts: 3,
                    baseDelay: 500,
                    operationName: 'Carregar histórico'
                }
            );

            if (saved && saved.length > 0) {
                // Pegar a entrada mais recente
                const latestEntry = saved.sort((a, b) => b.timestamp - a.timestamp)[0];
                this.#history = latestEntry.entries || [];
                console.log(`📥 Histórico carregado do IndexedDB (${this.#history.length} entradas)`);
            } else {
                console.log('ℹ️ Nenhum histórico encontrado no IndexedDB');
                this.#history = [];
            }
        } catch (error) {
            console.error('❌ [CalculationOrchestrator] Falha ao carregar histórico do IndexedDB:', error);
            // NO FALLBACK - inicializar vazio mas logar erro
            this.#history = [];
            throw new Error(`Falha ao carregar histórico: ${error.message}`);
        }
    }

    // ====================================================================
    // UI Update Helpers
    // ====================================================================

    /**
     * Atualiza UI com resultados
     * @param {Object} results
     */
    updateUI(results) {
        // Dispatch custom event (decoupled)
        const event = new CustomEvent('calculationsCompleted', {
            detail: results,
            bubbles: true
        });

        document.dispatchEvent(event);

        console.log('📡 Evento "calculationsCompleted" disparado');
    }

    // ====================================================================
    // Debug & Info
    // ====================================================================

    /**
     * Informações de debug
     * @returns {Object}
     */
    debug() {
        return {
            calculatorsRegistered: Array.from(this.#calculators.keys()),
            historySize: this.#history.length,
            maxHistorySize: this.#maxHistorySize,
            lastCalculation: this.getLastHistoryEntry()?.timestamp || null
        };
    }

    /**
     * Loga estado atual
     */
    log() {
        console.group('🎯 CalculationOrchestrator - Estado Atual');
        console.log('Calculators registrados:', Array.from(this.#calculators.keys()));
        console.log('Histórico:', `${this.#history.length}/${this.#maxHistorySize} entradas`);
        console.log('Último cálculo:', this.getLastHistoryEntry()?.timestamp || 'Nunca');
        console.groupEnd();
    }
}

// ====================================================================
// Singleton Instance
// NOTA: O singleton agora precisa ser inicializado externamente com dbManager
// Exemplo: await CalculationOrchestrator.initializeSingleton(dbManager);
// ====================================================================

let singletonInstance = null;

/**
 * Inicializa o singleton do CalculationOrchestrator
 * @param {Object} dbManager - Instância do CreditscoreIndexedDB
 * @returns {CalculationOrchestrator}
 */
CalculationOrchestrator.initializeSingleton = function(dbManager) {
    if (!singletonInstance) {
        singletonInstance = new CalculationOrchestrator(dbManager);
        console.log('✅ CalculationOrchestrator singleton inicializado');
    }
    return singletonInstance;
};

/**
 * Retorna a instância singleton (se já inicializada)
 * @returns {CalculationOrchestrator|null}
 */
CalculationOrchestrator.getInstance = function() {
    return singletonInstance;
};

// Export do getter do singleton (retrocompatibilidade)
export const getOrchestrator = () => {
    if (!singletonInstance) {
        throw new Error('CalculationOrchestrator: Singleton não foi inicializado. Execute CalculationOrchestrator.initializeSingleton(dbManager) primeiro.');
    }
    return singletonInstance;
};

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.CalculationOrchestrator = CalculationOrchestrator;
    window.getCalculationOrchestrator = getOrchestrator;
}
