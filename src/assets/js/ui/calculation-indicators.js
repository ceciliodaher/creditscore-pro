/**
 * calculation-indicators.js
 * Indicadores visuais de estado dos cálculos
 *
 * Atualiza indicadores nas abas de resultado (6, 7, 8) baseado no estado de cálculo
 * Usa Observable Pattern para reagir às mudanças de estado
 *
 * PRINCÍPIOS:
 * - DRY: Lógica centralizada de atualização de indicadores
 * - SOLID: Single Responsibility (apenas atualização visual)
 * - Event-Driven: Reage ao calculationState
 *
 * @version 1.0.0
 * @date 2025-01-25
 */

import { calculationState } from '../core/calculation-state.js';

/**
 * Gerenciador de indicadores visuais de cálculo
 */
export class CalculationIndicators {
    constructor() {
        this.resultTabs = [6, 7, 8]; // Abas de resultado: Índices, Scoring, Relatórios
        console.log('📊 [CalculationIndicators] Inicializado');
    }

    /**
     * Inicializa o sistema de indicadores
     * Assina eventos do calculationState
     */
    init() {
        // Subscrever aos eventos de mudança de estado
        calculationState.subscribe('stateChanged', (state) => {
            this.updateTabIndicators(state);
        });

        calculationState.subscribe('calculated', (state) => {
            this.updateTabIndicators(state);
        });

        // Atualizar indicadores inicialmente com estado atual
        const initialState = calculationState.getState();
        this.updateTabIndicators(initialState);

        console.log('✅ [CalculationIndicators] Event listeners configurados');
    }

    /**
     * Atualiza indicadores visuais nas abas
     * @param {Object} state - Estado atual do cálculo
     */
    updateTabIndicators(state) {
        this.resultTabs.forEach(tabNumber => {
            const tab = this.#findTabElement(tabNumber);

            if (!tab) {
                console.warn(`⚠️ [CalculationIndicators] Aba ${tabNumber} não encontrada`);
                return;
            }

            // Determinar status baseado no estado
            if (state.dataChanged) {
                // Dados mudaram - cálculos desatualizados
                tab.dataset.status = 'outdated';
            } else if (state.lastCalculated) {
                // Dados não mudaram e há cálculo recente - atualizado
                tab.dataset.status = 'updated';
            } else {
                // Sem cálculo ainda - neutro
                delete tab.dataset.status;
            }
        });

        console.log('📊 [CalculationIndicators] Indicadores atualizados:', {
            dataChanged: state.dataChanged,
            lastCalculated: state.lastCalculated,
            status: state.dataChanged ? 'outdated' : (state.lastCalculated ? 'updated' : 'neutral')
        });
    }

    /**
     * Encontra elemento da aba pelo número
     * @private
     * @param {number} tabNumber - Número da aba
     * @returns {HTMLElement|null}
     */
    #findTabElement(tabNumber) {
        // Tenta diferentes seletores possíveis
        const selectors = [
            `[data-tab="${tabNumber}"]`,           // data-tab attribute
            `.tab-item[data-tab="${tabNumber}"]`,  // com classe tab-item
            `#tab-${tabNumber}`,                   // ID tab-X
            `.tab-${tabNumber}`                    // classe tab-X
        ];

        for (const selector of selectors) {
            const element = document.querySelector(selector);
            if (element) {
                return element;
            }
        }

        return null;
    }

    /**
     * Remove todos os indicadores
     * Útil para reset ou cleanup
     */
    clearAllIndicators() {
        this.resultTabs.forEach(tabNumber => {
            const tab = this.#findTabElement(tabNumber);
            if (tab) {
                delete tab.dataset.status;
            }
        });

        console.log('🗑️ [CalculationIndicators] Indicadores limpos');
    }

    /**
     * Retorna informações de debug
     * @returns {Object}
     */
    debug() {
        const tabs = {};

        this.resultTabs.forEach(tabNumber => {
            const tab = this.#findTabElement(tabNumber);
            tabs[tabNumber] = {
                found: !!tab,
                status: tab?.dataset?.status || 'none',
                element: tab?.outerHTML?.substring(0, 100) || null
            };
        });

        return {
            resultTabs: this.resultTabs,
            tabs,
            state: calculationState.getState()
        };
    }

    /**
     * Loga estado atual para debug
     */
    log() {
        console.group('📊 CalculationIndicators - Estado Atual');
        console.table(this.debug().tabs);
        console.log('Estado do cálculo:', this.debug().state);
        console.groupEnd();
    }
}

// ====================================================================
// Singleton Instance & Auto-init
// ====================================================================

const indicators = new CalculationIndicators();

// Auto-inicializar quando DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        indicators.init();
    });
} else {
    // DOM já está pronto
    indicators.init();
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.CalculationIndicators = CalculationIndicators;
    window.calculationIndicators = indicators;
}

export default indicators;
