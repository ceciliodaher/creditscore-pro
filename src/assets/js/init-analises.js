/**
 * init-analises.js
 *
 * Script de inicialização do módulo de Análises Integradas.
 * Carrega e inicializa todos os componentes de FASE 2.
 *
 * Módulos carregados:
 * - FormDataAdapter (extração de dados)
 * - IntegrationOrchestrator (coordenação de cálculos)
 * - AnalysisRenderer (renderização)
 * - DemonstrativosHandlers (event handlers)
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

import DemonstrativosHandlers from './handlers/demonstrativos-handlers.js';

/**
 * Inicializa módulo de Análises Integradas
 * @returns {Promise<DemonstrativosHandlers|null>} Instância dos handlers ou null se falhar
 */
export async function initAnalisesIntegradas() {
    console.log('[initAnalisesIntegradas] 🚀 Inicializando módulo de Análises...');

    try {
        // Instanciar e inicializar handlers
        const handlers = new DemonstrativosHandlers();
        await handlers.inicializar();

        console.log('[initAnalisesIntegradas] ✅ Módulo de Análises inicializado com sucesso');
        return handlers;

    } catch (error) {
        console.error('[initAnalisesIntegradas] ❌ Falha ao inicializar:', error);

        // Exibir mensagem de erro ao usuário
        exibirErroInicializacao(error.message);

        return null;
    }
}

/**
 * Exibe mensagem de erro de inicialização
 * @private
 */
function exibirErroInicializacao(mensagem) {
    const containers = [
        '#ah-results',
        '#av-results',
        '#indicadores-liquidez .indicadores-grid'
    ];

    const errorHtml = `
        <div class="p-6 bg-red-50 border border-red-300 rounded-lg">
            <div class="flex items-start gap-3">
                <span class="text-2xl">❌</span>
                <div class="flex-1">
                    <h4 class="font-semibold text-red-900 mb-2">Erro ao inicializar análises</h4>
                    <p class="text-sm text-red-800 mb-3">${mensagem}</p>
                    <button
                        onclick="location.reload()"
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium"
                    >
                        🔄 Recarregar Página
                    </button>
                </div>
            </div>
        </div>
    `;

    containers.forEach(selector => {
        const container = document.querySelector(selector);
        if (container) {
            container.innerHTML = errorHtml;
        }
    });
}

/**
 * Disponibilizar globalmente
 */
if (typeof window !== 'undefined') {
    window.initAnalisesIntegradas = initAnalisesIntegradas;
}

console.log('✅ init-analises.js carregado');
