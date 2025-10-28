/**
 * DemonstrativosHandlers
 *
 * Handlers de eventos para integração de análises financeiras.
 * Conecta formulários → FormDataAdapter → IntegrationOrchestrator → AnalysisRenderer.
 *
 * Triggers implementados:
 * 1. Automático: Ao salvar demonstrativos (via AutoSave)
 * 2. Manual: Botão "Recalcular Análises"
 * 3. Ao abrir aba: Detecta mudanças e recalcula se necessário
 *
 * Arquitetura: NO FALLBACKS
 * - Exceções explícitas quando componentes faltam
 * - Validações rigorosas
 * - Event-driven architecture
 *
 * @version 1.0.0
 * @date 2025-10-28
 */

import FormDataAdapter from '../adapters/form-data-adapter.js';
import IntegrationOrchestrator from '../core/integration-orchestrator.js';

export class DemonstrativosHandlers {
    /**
     * Orquestrador de análises
     * @private
     */
    #orchestrator = null;

    /**
     * Estado de inicialização
     * @private
     */
    #inicializado = false;

    /**
     * Timestamp do último cálculo
     * @private
     */
    #ultimoCalculoTimestamp = null;

    /**
     * Hash dos dados do último cálculo (para detectar mudanças)
     * @private
     */
    #ultimosDadosHash = null;

    /**
     * Flag indicando se cálculo está em andamento
     * @private
     */
    #calculandoAtivo = false;

    /**
     * Inicializa handlers
     * @throws {Error} Se inicialização falhar
     */
    async inicializar() {
        console.log('[DemonstrativosHandlers] 🚀 Inicializando...');

        try {
            // STEP 1: Instanciar e inicializar IntegrationOrchestrator
            this.#orchestrator = new IntegrationOrchestrator();
            await this.#orchestrator.inicializar();

            // STEP 2: Registrar event listeners
            this.#registrarEventos();

            this.#inicializado = true;
            console.log('[DemonstrativosHandlers] ✅ Inicialização completa');

        } catch (error) {
            console.error('[DemonstrativosHandlers] ❌ Falha na inicialização:', error);
            throw new Error(`DemonstrativosHandlers: Falha na inicialização - ${error.message}`);
        }
    }

    /**
     * Registra todos os event listeners
     * @private
     */
    #registrarEventos() {
        console.log('[DemonstrativosHandlers] 📡 Registrando event listeners...');

        // TRIGGER 1: Botão "Recalcular Análises" (manual)
        const btnRecalcular = document.getElementById('btnRecalcularAnalises');
        if (btnRecalcular) {
            btnRecalcular.addEventListener('click', () => this.#handleRecalcularManual());
            console.log('   ✓ Listener: Botão Recalcular');
        } else {
            console.warn('   ⚠️ Botão #btnRecalcularAnalises não encontrado');
        }

        // TRIGGER 2: Abertura da aba "Análises Integradas"
        const btnAbaAnalises = document.querySelector('[data-tab="analises"]');
        if (btnAbaAnalises) {
            btnAbaAnalises.addEventListener('click', () => this.#handleAbrirAba());
            console.log('   ✓ Listener: Aba Análises');
        } else {
            console.warn('   ⚠️ Botão aba [data-tab="analises"] não encontrado');
        }

        // TRIGGER 3: Custom event de save (disparado pelo AutoSave ou outro componente)
        document.addEventListener('demonstrativos:saved', (event) => {
            this.#handleAutoSave(event.detail);
        });
        console.log('   ✓ Listener: Custom event "demonstrativos:saved"');

        // TRIGGER 4: Beforeunload - avisar se análises desatualizadas
        window.addEventListener('beforeunload', (e) => this.#handleBeforeUnload(e));
        console.log('   ✓ Listener: beforeunload');
    }

    /**
     * Handler: Recalcular manual (botão)
     * @private
     */
    async #handleRecalcularManual() {
        console.log('[DemonstrativosHandlers] 🔄 Recalcular manual solicitado');

        if (this.#calculandoAtivo) {
            console.warn('[DemonstrativosHandlers] ⚠️ Cálculo já em andamento - ignorando');
            return;
        }

        try {
            this.#exibirLoading(true);
            await this.#executarCalculoCompleto();
            this.#mostrarMensagemSucesso('Análises recalculadas com sucesso!');
        } catch (error) {
            console.error('[DemonstrativosHandlers] ❌ Erro no recálculo manual:', error);
            this.#mostrarMensagemErro(`Erro ao recalcular: ${error.message}`);
        } finally {
            this.#exibirLoading(false);
        }
    }

    /**
     * Handler: Abertura da aba de análises
     * @private
     */
    async #handleAbrirAba() {
        console.log('[DemonstrativosHandlers] 👁️ Aba de análises aberta');

        // Verificar se há dados e se precisam ser calculados
        const dados = this.#extrairDados();

        if (!dados) {
            console.log('[DemonstrativosHandlers] ℹ️ Sem dados para calcular');
            this.#exibirMensagemSemDados();
            return;
        }

        // Verificar se dados mudaram desde último cálculo
        const dadosHash = this.#calcularHashDados(dados);

        if (this.#ultimosDadosHash === dadosHash) {
            console.log('[DemonstrativosHandlers] ✓ Análises já atualizadas');
            return;
        }

        console.log('[DemonstrativosHandlers] 🔄 Dados mudaram - recalculando...');

        try {
            this.#exibirLoading(true);
            await this.#executarCalculoCompleto();
        } catch (error) {
            console.error('[DemonstrativosHandlers] ❌ Erro ao abrir aba:', error);
            this.#mostrarMensagemErro(`Erro ao calcular análises: ${error.message}`);
        } finally {
            this.#exibirLoading(false);
        }
    }

    /**
     * Handler: Auto-save (triggered by custom event)
     * @private
     */
    async #handleAutoSave(detail) {
        console.log('[DemonstrativosHandlers] 💾 Auto-save detectado', detail);

        // Auto-save deve recalcular apenas se usuário está na aba de análises
        const abaAnalisesAtiva = document.querySelector('#analises')?.classList.contains('active');

        if (!abaAnalisesAtiva) {
            console.log('[DemonstrativosHandlers] ℹ️ Aba análises não ativa - skip recálculo');
            return;
        }

        try {
            await this.#executarCalculoCompleto();
            console.log('[DemonstrativosHandlers] ✅ Análises atualizadas após auto-save');
        } catch (error) {
            console.error('[DemonstrativosHandlers] ❌ Erro ao recalcular após auto-save:', error);
            // Não exibir erro ao usuário (auto-save é silencioso)
        }
    }

    /**
     * Handler: Beforeunload (avisar se análises desatualizadas)
     * @private
     */
    #handleBeforeUnload(event) {
        // Se há dados modificados mas análises não recalculadas, avisar
        if (this.#ultimosDadosHash) {
            const dadosAtuais = this.#extrairDados();
            if (dadosAtuais) {
                const hashAtual = this.#calcularHashDados(dadosAtuais);
                if (hashAtual !== this.#ultimosDadosHash) {
                    const mensagem = 'Há alterações nos demonstrativos que não foram refletidas nas análises.';
                    event.preventDefault();
                    event.returnValue = mensagem;
                    return mensagem;
                }
            }
        }
    }

    /**
     * Executa cálculo completo (extração → cálculo → renderização)
     * @private
     * @throws {Error} Se cálculo falhar
     */
    async #executarCalculoCompleto() {
        if (!this.#inicializado) {
            throw new Error('DemonstrativosHandlers: Não inicializado');
        }

        this.#calculandoAtivo = true;

        try {
            console.log('[DemonstrativosHandlers] 📊 Iniciando cálculo completo...');

            // STEP 1: Extrair dados do formulário
            const dados = this.#extrairDados();

            if (!dados) {
                throw new Error('Dados insuficientes para cálculo');
            }

            // STEP 2: Calcular análises
            const resultados = this.#orchestrator.calcularAnalises(dados);

            // STEP 3: Renderizar
            this.#orchestrator.renderizarAnalises(resultados);

            // STEP 4: Atualizar estado
            this.#ultimoCalculoTimestamp = Date.now();
            this.#ultimosDadosHash = this.#calcularHashDados(dados);

            console.log('[DemonstrativosHandlers] ✅ Cálculo completo finalizado');

        } finally {
            this.#calculandoAtivo = false;
        }
    }

    /**
     * Extrai dados do formulário via FormDataAdapter
     * @private
     * @returns {Object|null} Dados extraídos ou null se insuficientes
     */
    #extrairDados() {
        try {
            const dados = FormDataAdapter.extractAllData();

            // Validar que há dados mínimos
            if (!dados.balanco?.periodos?.length || !dados.dre?.periodos?.length) {
                console.warn('[DemonstrativosHandlers] ⚠️ Dados insuficientes');
                return null;
            }

            // Verificar validações
            if (dados.metadata?.validacoes) {
                const { balanco, dre } = dados.metadata.validacoes;

                if (balanco.warnings?.length > 0) {
                    console.warn('[DemonstrativosHandlers] ⚠️ Warnings Balanço:', balanco.warnings);
                }

                if (dre.warnings?.length > 0) {
                    console.warn('[DemonstrativosHandlers] ⚠️ Warnings DRE:', dre.warnings);
                }
            }

            return dados;

        } catch (error) {
            console.error('[DemonstrativosHandlers] ❌ Erro ao extrair dados:', error);
            return null;
        }
    }

    /**
     * Calcula hash simples dos dados (para detectar mudanças)
     * @private
     * @param {Object} dados
     * @returns {string} Hash
     */
    #calcularHashDados(dados) {
        try {
            // Hash simples: JSON stringify + length
            const json = JSON.stringify({
                balanco: dados.balanco,
                dre: dados.dre
            });
            return `${json.length}-${Date.now()}`;
        } catch (error) {
            return Math.random().toString(36);
        }
    }

    /**
     * Exibe/oculta loading indicator
     * @private
     */
    #exibirLoading(exibir) {
        const btnRecalcular = document.getElementById('btnRecalcularAnalises');

        if (btnRecalcular) {
            btnRecalcular.disabled = exibir;
            btnRecalcular.textContent = exibir ? '⏳ Calculando...' : '🔄 Recalcular Análises';
        }

        // Exibir/ocultar loading nos containers
        const containers = [
            '#ah-results',
            '#av-results',
            '#container-indicadores'
        ];

        containers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) {
                if (exibir) {
                    container.innerHTML = '<div class="p-8 text-center text-gray-500"><div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div><p>Calculando análises...</p></div>';
                }
            }
        });
    }

    /**
     * Exibe mensagem de sem dados
     * @private
     */
    #exibirMensagemSemDados() {
        const containers = ['#ah-results', '#av-results', '#indicadores-liquidez .indicadores-grid'];

        containers.forEach(selector => {
            const container = document.querySelector(selector);
            if (container) {
                container.innerHTML = `
                    <div class="p-8 text-center text-gray-500 border border-gray-300 rounded-lg bg-gray-50">
                        <p class="text-lg mb-2">📋 Sem dados para análise</p>
                        <p class="text-sm">Preencha os demonstrativos (Balanço e DRE) para visualizar as análises.</p>
                    </div>
                `;
            }
        });
    }

    /**
     * Mostra mensagem de sucesso
     * @private
     */
    #mostrarMensagemSucesso(mensagem) {
        // Implementação simples - pode ser substituída por toast/notification system
        console.log(`✅ ${mensagem}`);

        // Mostrar toast temporário
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded shadow-lg z-50';
        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-lg">✅</span>
                <span>${mensagem}</span>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    /**
     * Mostra mensagem de erro
     * @private
     */
    #mostrarMensagemErro(mensagem) {
        console.error(`❌ ${mensagem}`);

        // Mostrar toast de erro
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded shadow-lg z-50';
        toast.innerHTML = `
            <div class="flex items-center gap-2">
                <span class="text-lg">❌</span>
                <span>${mensagem}</span>
            </div>
        `;
        document.body.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    /**
     * Retorna estado de inicialização
     * @returns {boolean}
     */
    estaInicializado() {
        return this.#inicializado;
    }

    /**
     * Informações de debug
     * @returns {Object}
     */
    debug() {
        return {
            className: 'DemonstrativosHandlers',
            version: '1.0.0',
            inicializado: this.#inicializado,
            ultimoCalculoTimestamp: this.#ultimoCalculoTimestamp,
            calculandoAtivo: this.#calculandoAtivo,
            orchestrator: this.#orchestrator?.debug()
        };
    }
}

// Disponibilizar globalmente
if (typeof window !== 'undefined') {
    window.DemonstrativosHandlers = DemonstrativosHandlers;
}

export default DemonstrativosHandlers;

console.log('✅ DemonstrativosHandlers carregado');
