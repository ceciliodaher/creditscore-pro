/**
 * calculation-state.js
 * Gerenciamento centralizado do estado de cálculo
 *
 * Implementa Observable Pattern para reactive updates
 * SOLID: Single Responsibility Principle
 * DRY: Single source of truth para status de cálculos
 * NO FALLBACKS: Erros explícitos, não silenciados
 *
 * @version 1.0.0
 * @date 2025-01-25
 */

export class CalculationState {
    #state = {
        lastCalculated: null,
        dataChanged: false,
        calculationInProgress: false,
        errors: [],
        validationResults: null
    };

    #listeners = new Map();
    #storage = window.localStorage;

    constructor() {
        this.loadState();
        console.log('📊 [CalculationState] Inicializado');
    }

    // ====================================================================
    // Observable Pattern: Subscribe to state changes
    // ====================================================================

    /**
     * Inscreve um callback para eventos específicos
     * @param {string} event - Nome do evento ('stateChanged', 'calculated', 'error')
     * @param {Function} callback - Função a ser executada
     * @returns {Function} Função de unsubscribe
     */
    subscribe(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }

        this.#listeners.get(event).add(callback);

        // Return unsubscribe function
        return () => {
            this.#listeners.get(event)?.delete(callback);
        };
    }

    /**
     * Emite evento para todos os subscribers
     * @private
     */
    #emit(event, data) {
        if (this.#listeners.has(event)) {
            this.#listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[CalculationState] Erro no listener '${event}':`, error);
                }
            });
        }
    }

    // ====================================================================
    // State Mutations (Immutable Updates)
    // ====================================================================

    /**
     * Marca dados como alterados (necessita recálculo)
     */
    markDirty() {
        if (!this.#state.dataChanged) {
            this.#state = { ...this.#state, dataChanged: true };
            this.#emit('stateChanged', this.getState());
            this.saveState();

            console.log('⚡ [CalculationState] Dados marcados como alterados');
        }
    }

    /**
     * Marca cálculo como concluído
     * @param {Object} results - Resultados do cálculo e validação
     */
    markCalculated(results) {
        this.#state = {
            ...this.#state,
            dataChanged: false,
            lastCalculated: new Date().toISOString(),
            calculationInProgress: false,
            errors: [],
            validationResults: results.validation
        };

        this.#emit('calculated', this.getState());
        this.saveState();

        console.log('✅ [CalculationState] Cálculo concluído e estado atualizado');
    }

    /**
     * Define estado de cálculo em progresso
     * @param {boolean} isCalculating
     */
    setCalculating(isCalculating) {
        this.#state = {
            ...this.#state,
            calculationInProgress: isCalculating
        };

        this.#emit('stateChanged', this.getState());

        if (isCalculating) {
            console.log('⏳ [CalculationState] Cálculo em progresso...');
        }
    }

    /**
     * Registra erro no estado
     * @param {Error} error
     */
    setError(error) {
        this.#state = {
            ...this.#state,
            errors: [...this.#state.errors, {
                message: error.message,
                name: error.name,
                timestamp: new Date().toISOString()
            }],
            calculationInProgress: false
        };

        this.#emit('error', error);
        this.saveState();

        console.error('❌ [CalculationState] Erro registrado:', error.message);
    }

    /**
     * Limpa erros do estado
     */
    clearErrors() {
        this.#state = {
            ...this.#state,
            errors: []
        };

        this.#emit('stateChanged', this.getState());
        this.saveState();

        console.log('🧹 [CalculationState] Erros limpos');
    }

    // ====================================================================
    // Getters (Immutable)
    // ====================================================================

    /**
     * Retorna cópia imutável do estado
     * @returns {Object} Estado atual (frozen)
     */
    getState() {
        return Object.freeze({ ...this.#state });
    }

    /**
     * Verifica se dados foram alterados
     * @returns {boolean}
     */
    isDirty() {
        return this.#state.dataChanged;
    }

    /**
     * Verifica se cálculo está em progresso
     * @returns {boolean}
     */
    isCalculating() {
        return this.#state.calculationInProgress;
    }

    /**
     * Verifica se há erros
     * @returns {boolean}
     */
    hasErrors() {
        return this.#state.errors.length > 0;
    }

    /**
     * Retorna timestamp do último cálculo
     * @returns {Date|null}
     */
    getLastCalculated() {
        return this.#state.lastCalculated ? new Date(this.#state.lastCalculated) : null;
    }

    /**
     * Retorna tempo desde último cálculo (em minutos)
     * @returns {number|null}
     */
    getMinutesSinceLastCalculation() {
        if (!this.#state.lastCalculated) return null;

        const now = new Date();
        const last = new Date(this.#state.lastCalculated);
        const diffMs = now - last;

        return Math.floor(diffMs / 60000);
    }

    // ====================================================================
    // Persistence (NO HARDCODED DATA)
    // ====================================================================

    /**
     * Salva estado no localStorage
     */
    saveState() {
        const persistable = {
            lastCalculated: this.#state.lastCalculated,
            validationResults: this.#state.validationResults,
            errors: this.#state.errors
        };

        try {
            this.#storage.setItem('calculationState', JSON.stringify(persistable));
        } catch (error) {
            console.error('[CalculationState] Falha ao salvar estado:', error);
            // NO FALLBACK - deixa erro visível
            throw new Error(`Falha ao persistir estado de cálculo: ${error.message}`);
        }
    }

    /**
     * Carrega estado do localStorage
     */
    loadState() {
        try {
            const saved = this.#storage.getItem('calculationState');

            if (saved) {
                const parsed = JSON.parse(saved);
                this.#state = { ...this.#state, ...parsed };

                console.log('📥 [CalculationState] Estado restaurado do localStorage');
            }
        } catch (error) {
            console.error('[CalculationState] Falha ao carregar estado:', error);
            // NO FALLBACK - estado inicial permanece
        }
    }

    /**
     * Limpa estado persistido
     */
    clearPersistedState() {
        try {
            this.#storage.removeItem('calculationState');
            console.log('🗑️ [CalculationState] Estado persistido removido');
        } catch (error) {
            console.error('[CalculationState] Falha ao limpar estado:', error);
        }
    }

    // ====================================================================
    // Debug Helpers
    // ====================================================================

    /**
     * Retorna informações de debug do estado
     * @returns {Object}
     */
    debug() {
        return {
            state: this.#state,
            listeners: Array.from(this.#listeners.entries()).map(([event, callbacks]) => ({
                event,
                callbackCount: callbacks.size
            })),
            minutesSinceLastCalculation: this.getMinutesSinceLastCalculation()
        };
    }

    /**
     * Loga estado atual no console (formatado)
     */
    log() {
        console.group('📊 CalculationState - Estado Atual');
        console.log('Dados Alterados:', this.#state.dataChanged ? '⚡ Sim' : '✓ Não');
        console.log('Calculando:', this.#state.calculationInProgress ? '⏳ Sim' : '✓ Não');
        console.log('Último Cálculo:', this.#state.lastCalculated || 'Nunca');
        console.log('Minutos desde último:', this.getMinutesSinceLastCalculation() || 'N/A');
        console.log('Erros:', this.#state.errors.length);
        console.log('Listeners ativos:', this.#listeners.size);
        console.groupEnd();
    }
}

// ====================================================================
// Singleton Instance
// ====================================================================

export const calculationState = new CalculationState();

// Disponibilizar globalmente para módulos legados
if (typeof window !== 'undefined') {
    window.CalculationState = CalculationState;
    window.calculationState = calculationState;
}
