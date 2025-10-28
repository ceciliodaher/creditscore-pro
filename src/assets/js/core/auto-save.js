/* =====================================
   AUTO-SAVE.JS
   Sistema de salvamento automático com IndexedDB
   NO FALLBACKS - NO HARDCODED DATA
   @version 2.0.0
   @date 2025-01-26
   @changes Removidos fallbacks localStorage (exceto forceSave para beforeunload)
   ===================================== */

import { retryIndexedDBOperation, validateIndexedDBAvailable } from '../utils/indexeddb-retry.js';

/**
 * Sistema de auto-save automático
 * Salva dados do formulário em IndexedDB a cada 30 segundos
 * Exibe prompt de restauração ao reabrir a aplicação
 * Integra com FormCore, NavigationController e CreditScoreModule
 *
 * @class AutoSave
 */
export class AutoSave {
    /**
     * @param {Object} config - Configuração completa do sistema (creditscore-config.json)
     * @param {Object} messages - Mensagens do sistema (messages.json)
     * @param {IndexedDBManager} dbManager - Instância do IndexedDBManager
     * @throws {Error} Se config, messages ou dbManager ausentes ou inválidos
     */
    constructor(config, messages, dbManager) {
        // Validação obrigatória - NO FALLBACKS
        if (!config) {
            throw new Error('AutoSave: config obrigatória não fornecida');
        }

        if (!messages) {
            throw new Error('AutoSave: messages obrigatório não fornecido');
        }

        if (!dbManager) {
            throw new Error('AutoSave: dbManager obrigatório não fornecido');
        }

        // Validar estrutura mínima da config
        if (!config.modules || !Array.isArray(config.modules)) {
            throw new Error('AutoSave: config.modules deve ser um array');
        }

        if (typeof config.totalSteps !== 'number' || config.totalSteps < 1) {
            throw new Error('AutoSave: config.totalSteps deve ser um número positivo');
        }

        if (typeof config.autoSaveInterval !== 'number' || config.autoSaveInterval < 1000) {
            throw new Error('AutoSave: config.autoSaveInterval deve ser >= 1000ms');
        }

        // Validar messages
        if (!messages.autosave) {
            throw new Error('AutoSave: messages.autosave obrigatório');
        }

        if (!messages.icons) {
            throw new Error('AutoSave: messages.icons obrigatório');
        }

        this.config = config;
        this.messages = messages;
        this.db = dbManager;

        // Validar IndexedDB disponível
        validateIndexedDBAvailable();

        // Intervalo de auto-save (30s padrão da config)
        this.autoSaveInterval = config.autoSaveInterval;

        // Estado
        this.timerId = null;
        this.lastSaveTimestamp = null;
        this.isDirty = false;
        this.isRunning = false;

        // Referências a outros componentes (definidas no init)
        this.module = null;
        this.navigationController = null;

        console.log(`✅ AutoSave instanciado (intervalo: ${this.autoSaveInterval / 1000}s)`);
    }

    /**
     * Inicialização assíncrona
     * @param {Object|null} creditScoreModule - Instância do CreditScoreModule (opcional - pode ser null)
     * @param {Object} navigationController - Instância do NavigationController (obrigatório)
     * @returns {Promise<boolean>}
     */
    async init(creditScoreModule, navigationController) {
        // creditScoreModule é opcional - AutoSave pode funcionar sem ele
        this.module = creditScoreModule;

        // navigationController é OBRIGATÓRIO
        if (!navigationController) {
            throw new Error('AutoSave: navigationController obrigatório não fornecido - DEVE ser passado no init()');
        }

        // Validar que navigationController tem a API esperada
        if (typeof navigationController.currentModule !== 'number') {
            throw new Error('AutoSave: navigationController inválido - currentModule deve ser number');
        }

        this.navigationController = navigationController;

        // Verificar se database está disponível
        if (!this.db || typeof this.db.init !== 'function') {
            throw new Error('AutoSave: dbManager não possui API esperada (init)');
        }

        // Configurar event listeners
        this.#attachEventListeners();

        // Configurar beforeunload
        this.#setupBeforeUnload();

        // Checar dados salvos ao iniciar
        const restored = await this.checkForSavedData();

        if (restored) {
            console.log('✅ Sessão anterior restaurada via AutoSave');
        } else {
            console.log('🆕 Nova sessão iniciada');
        }

        // Iniciar auto-save
        this.start();

        console.log('✅ AutoSave inicializado');
        return true;
    }

    /**
     * Inicia timer de auto-save
     */
    start() {
        if (this.timerId) {
            console.warn('⚠️ AutoSave já está rodando');
            return;
        }

        this.timerId = setInterval(() => {
            if (this.isDirty) {
                this.#performAutoSave();
            }
        }, this.autoSaveInterval);

        this.isRunning = true;

        console.log(`🚀 AutoSave iniciado (${this.autoSaveInterval / 1000}s)`);
    }

    /**
     * Para timer de auto-save
     */
    stop() {
        if (this.timerId) {
            clearInterval(this.timerId);
            this.timerId = null;
            this.isRunning = false;
            console.log('⏹️ AutoSave parado');
        }
    }

    /**
     * Altera intervalo de auto-save e reinicia timer
     * @param {number} newInterval - Novo intervalo em ms
     */
    setInterval(newInterval) {
        if (typeof newInterval !== 'number' || newInterval < 1000) {
            throw new Error('AutoSave: newInterval deve ser >= 1000ms');
        }

        this.autoSaveInterval = newInterval;

        if (this.timerId) {
            this.stop();
            this.start();
        }

        console.log(`⚙️ Intervalo de auto-save alterado para ${newInterval / 1000}s`);
    }

    /**
     * Verifica e exibe prompt de restauração ao iniciar
     * @returns {Promise<boolean>} true se dados foram restaurados
     */
    async checkForSavedData() {
        let savedData = null;

        // Buscar dados no IndexedDB com retry
        try {
            savedData = await retryIndexedDBOperation(
                () => this.db.get('autosave', 'current_session'),
                {
                    maxAttempts: 3,
                    baseDelay: 500,
                    operationName: 'Verificar dados salvos'
                }
            );
        } catch (error) {
            console.error('❌ Erro ao buscar dados salvos no IndexedDB:', error);
            // NO FALLBACK - falhar explicitamente
            throw new Error(`Falha ao verificar dados salvos: ${error.message}`);
        }

        if (!savedData) {
            console.log('ℹ️ Nenhum dado salvo encontrado no IndexedDB');
            return false;
        }

        // Validar estrutura dos dados salvos
        if (!savedData.timestamp || typeof savedData.timestamp !== 'number') {
            throw new Error('AutoSave: dados salvos possuem timestamp inválido');
        }

        // Verificar idade dos dados (não restaurar se > 7 dias)
        const age = Date.now() - savedData.timestamp;
        const MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 dias

        if (age > MAX_AGE) {
            console.log('ℹ️ Dados salvos muito antigos (>7 dias), descartando');
            await this.clearSavedData();
            return false;
        }

        // Exibir prompt de restauração
        return await this.#showRestorePrompt(savedData);
    }

    /**
     * Salva dados do formulário
     * @returns {Promise<boolean>}
     */
    async save() {
        try {
            // Coletar dados
            const formData = this.#collectFormData();
            const moduleId = this.#getCurrentModuleId();
            const completedModules = this.#getCompletedModules();

            const saveData = {
                id: 'current_session',
                timestamp: Date.now(),
                moduleId: moduleId,
                formData: formData,
                completedModules: completedModules,
                version: this.config.version
            };

            // Salvar no IndexedDB com retry
            await retryIndexedDBOperation(
                () => this.db.save('autosave', saveData),
                {
                    maxAttempts: 3,
                    baseDelay: 500,
                    operationName: 'Salvar dados de auto-save'
                }
            );

            this.lastSaveTimestamp = saveData.timestamp;
            this.isDirty = false;

            // Marcar dados como alterados para recálculo automático
            if (window.calculationState) {
                window.calculationState.markDirty();
            }

            this.#updateSaveStatus(this.messages.autosave.saved);
            console.log('💾 AutoSave: dados salvos no IndexedDB');
            return true;
        } catch (error) {
            console.error('❌ Erro ao salvar dados:', error);
            this.#updateSaveStatus(this.messages.autosave.error);
            return false;
        }
    }

    /**
     * Restaura dados salvos no formulário
     * @param {Object} savedData - Dados salvos
     * @returns {Promise<boolean>}
     */
    async restoreData(savedData) {
        if (!savedData) {
            throw new Error('AutoSave: savedData obrigatório não fornecido');
        }

        if (!savedData.formData) {
            throw new Error('AutoSave: savedData.formData obrigatório');
        }

        try {
            console.log('🔄 Restaurando dados salvos...');

            // Restaurar dados do formulário via módulo
            if (this.module && typeof this.module.restaurarDadosFormulario === 'function') {
                this.module.restaurarDadosFormulario(savedData.formData);
            } else {
                // Fallback: popular campos diretamente do DOM
                this.#populateFormDirectly(savedData.formData);
            }

            // Restaurar módulos completados
            if (this.navigationController && savedData.completedModules && Array.isArray(savedData.completedModules)) {
                savedData.completedModules.forEach(moduleId => {
                    this.navigationController.markModuleComplete(moduleId);
                });
            }

            // Navegar para o módulo salvo
            if (this.navigationController && savedData.moduleId) {
                if (typeof savedData.moduleId !== 'number') {
                    throw new Error('AutoSave: savedData.moduleId deve ser um número');
                }

                await this.navigationController.navigateToModule(savedData.moduleId);
            }

            this.isDirty = false;
            console.log('✅ Dados restaurados com sucesso');

            // Disparar evento de restauração
            this.#dispatchEvent('autoSaveRestored', {
                moduleId: savedData.moduleId,
                completedModules: savedData.completedModules,
                timestamp: savedData.timestamp
            });

            // Mostrar notificação
            this.#showNotification(this.messages.autosave.restored, 'success');

            return true;
        } catch (error) {
            console.error('❌ Erro ao restaurar dados:', error);
            this.#showNotification(this.messages.autosave.error, 'error');
            return false;
        }
    }

    /**
     * Limpa dados salvos
     * @returns {Promise<void>}
     */
    async clearSavedData() {
        try {
            // Limpar IndexedDB com retry
            await retryIndexedDBOperation(
                () => this.db.delete('autosave', 'current_session'),
                {
                    maxAttempts: 3,
                    baseDelay: 500,
                    operationName: 'Limpar dados de auto-save'
                }
            );

            console.log('🗑️ Dados de auto-save limpos do IndexedDB');
        } catch (error) {
            console.error('❌ Erro ao limpar dados do IndexedDB:', error);
            // NO FALLBACK - erro explícito
            throw new Error(`Falha ao limpar dados salvos: ${error.message}`);
        }
    }

    /**
     * Força salvamento imediato (usado em beforeunload)
     * NOTA: Este método usa localStorage por ser síncrono.
     * IndexedDB é assíncrono e não pode ser usado no beforeunload handler.
     * Este é o ÚNICO local onde localStorage é permitido no sistema.
     */
    forceSave() {
        if (this.isDirty) {
            // Salvamento síncrono para beforeunload
            try {
                const formData = this.#collectFormData();
                const saveData = {
                    id: 'current_session',
                    timestamp: Date.now(),
                    moduleId: this.#getCurrentModuleId(),
                    formData: formData,
                    completedModules: this.#getCompletedModules(),
                    version: this.config.version
                };

                // localStorage é síncrono, ideal para beforeunload (EXCEÇÃO justificada)
                localStorage.setItem('creditscore_autosave', JSON.stringify(saveData));

                // Marcar dados como alterados para recálculo automático
                if (window.calculationState) {
                    window.calculationState.markDirty();
                }

                console.log('💾 AutoSave: salvamento forçado antes de sair');
            } catch (error) {
                console.error('❌ Erro no salvamento forçado:', error);
            }
        }
    }

    /**
     * Salva dados imediatamente (usado para save manual)
     */
    saveNow() {
        this.#performAutoSave();
    }

    // ============================================
    // MÉTODOS PRIVADOS
    // ============================================

    /**
     * Executa salvamento automático
     * @private
     */
    async #performAutoSave() {
        try {
            this.#updateSaveStatus(this.messages.autosave.saving);
            await this.save();
        } catch (error) {
            console.error('❌ Erro no auto-save:', error);
            this.#updateSaveStatus(this.messages.autosave.error);
        }
    }

    /**
     * Coleta dados do formulário
     * @private
     * @returns {Object}
     */
    #collectFormData() {
        // Tentar coletar via CreditScoreModule
        if (this.module && typeof this.module.coletarDadosFormulario === 'function') {
            return this.module.coletarDadosFormulario();
        }

        // Fallback: coletar direto do DOM
        const formData = {};
        const form = document.getElementById('creditScoreForm');

        if (!form) {
            console.warn('⚠️ Formulário #creditScoreForm não encontrado no DOM');
            return formData;
        }

        const data = new FormData(form);
        for (const [key, value] of data.entries()) {
            formData[key] = value;
        }

        return formData;
    }

    /**
     * Obtém ID do módulo atual
     * @private
     * @returns {number}
     */
    #getCurrentModuleId() {
        if (this.navigationController && typeof this.navigationController.currentModule === 'number') {
            return this.navigationController.currentModule;
        }

        // Fallback: extrair do DOM
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            const tabId = activeTab.getAttribute('data-tab');
            if (tabId) {
                return parseInt(tabId, 10);
            }
        }

        // Se não conseguiu obter, retornar 1 (módulo inicial)
        return 1;
    }

    /**
     * Obtém lista de módulos completos
     * @private
     * @returns {Array<number>}
     */
    #getCompletedModules() {
        if (this.navigationController && this.navigationController.completedModules instanceof Set) {
            return Array.from(this.navigationController.completedModules);
        }

        // Fallback: array vazio
        return [];
    }

    /**
     * Atualiza status visual de salvamento
     * @private
     * @param {string} message
     */
    #updateSaveStatus(message) {
        if (!message) {
            throw new Error('AutoSave: message obrigatória para updateSaveStatus');
        }

        const statusElement = document.querySelector('.autosave-status');
        if (statusElement) {
            statusElement.textContent = message;
        }
    }

    /**
     * Exibe prompt de restauração
     * @private
     * @param {Object} savedData
     * @returns {Promise<boolean>}
     */
    #showRestorePrompt(savedData) {
        return new Promise((resolve) => {
            const modal = this.#createRestoreModal(savedData);
            document.body.appendChild(modal);

            // Botão Restaurar
            const btnRestore = modal.querySelector('.btn-restore');
            if (!btnRestore) {
                throw new Error('AutoSave: botão .btn-restore não encontrado no modal');
            }

            btnRestore.onclick = async () => {
                await this.restoreData(savedData);
                modal.remove();
                resolve(true);
            };

            // Botão Descartar
            const btnDiscard = modal.querySelector('.btn-discard');
            if (!btnDiscard) {
                throw new Error('AutoSave: botão .btn-discard não encontrado no modal');
            }

            btnDiscard.onclick = async () => {
                await this.clearSavedData();
                modal.remove();
                resolve(false);
            };
        });
    }

    /**
     * Cria HTML do modal de restauração
     * @private
     * @param {Object} savedData
     * @returns {HTMLElement}
     */
    #createRestoreModal(savedData) {
        if (!savedData.timestamp) {
            throw new Error('AutoSave: savedData.timestamp obrigatório para modal');
        }

        const moduleName = this.#getModuleName(savedData.moduleId);
        const completedCount = savedData.completedModules ? savedData.completedModules.length : 0;

        const modal = document.createElement('div');
        modal.className = 'modal modal-restore';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>💾 Dados Salvos Encontrados</h2>
                </div>
                <div class="modal-body">
                    <p>Encontramos uma análise de crédito não finalizada:</p>
                    <ul class="saved-data-info">
                        <li><strong>Data:</strong> ${new Date(savedData.timestamp).toLocaleString('pt-BR')}</li>
                        <li><strong>Módulo:</strong> ${moduleName}</li>
                        <li><strong>Progresso:</strong> ${completedCount} de ${this.config.totalSteps} módulos</li>
                    </ul>
                    <p>${this.messages.autosave.restore_prompt}</p>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-secondary btn-discard">
                        ${this.messages.autosave.restore_no}
                    </button>
                    <button class="btn btn-primary btn-restore">
                        ${this.messages.autosave.restore_yes}
                    </button>
                </div>
            </div>
        `;

        return modal;
    }

    /**
     * Obtém nome do módulo pelo ID
     * @private
     * @param {number} moduleId
     * @returns {string}
     */
    #getModuleName(moduleId) {
        const module = this.config.modules.find(m => m.id === moduleId);

        if (!module) {
            return `Módulo ${moduleId}`;
        }

        return module.title;
    }

    /**
     * Anexa event listeners para detectar mudanças
     * @private
     */
    #attachEventListeners() {
        // Ouvir mudanças em campos
        document.addEventListener('input', (e) => {
            if (e.target.matches('input, select, textarea')) {
                this.isDirty = true;
            }
        });

        // Ouvir eventos customizados
        document.addEventListener('fieldChanged', () => {
            this.isDirty = true;
        });

        document.addEventListener('formValidated', () => {
            this.isDirty = true;
        });

        document.addEventListener('moduleCompleted', () => {
            this.isDirty = true;
        });

        console.log('👂 AutoSave: event listeners anexados');
    }

    /**
     * Configura salvamento antes de sair da página
     * @private
     */
    #setupBeforeUnload() {
        window.addEventListener('beforeunload', (e) => {
            if (this.isDirty) {
                this.forceSave();

                // Mostrar confirmação de saída
                if (this.config.ui && this.config.ui.navigation && this.config.ui.navigation.confirmOnExit === true) {
                    e.preventDefault();
                    e.returnValue = this.messages.navigation.exit_confirm;
                    return e.returnValue;
                }
            }
        });

        console.log('👂 AutoSave: beforeunload configurado');
    }

    /**
     * Popula formulário diretamente do DOM (fallback)
     * @private
     * @param {Object} formData
     */
    #populateFormDirectly(formData) {
        if (!formData || typeof formData !== 'object') {
            throw new Error('AutoSave: formData deve ser um objeto válido');
        }

        for (const [key, value] of Object.entries(formData)) {
            const field = document.querySelector(`[name="${key}"]`);
            if (field) {
                if (field.type === 'checkbox' || field.type === 'radio') {
                    field.checked = Boolean(value);
                } else {
                    field.value = value;
                }
            }
        }

        console.log('📝 Campos populados diretamente no DOM');
    }

    /**
     * Mostra notificação
     * @private
     * @param {string} message
     * @param {string} type - 'success', 'error', 'warning', 'info'
     */
    #showNotification(message, type) {
        if (!message) {
            throw new Error('AutoSave: message obrigatória para notificação');
        }

        if (!type) {
            throw new Error('AutoSave: type obrigatório para notificação');
        }

        // Verificar se Toast existe
        if (window.Toast && typeof window.Toast.show === 'function') {
            window.Toast.show(message, type);
        } else {
            console.log(`📢 Notificação [${type}]: ${message}`);
        }
    }

    /**
     * Dispara evento customizado
     * @private
     * @param {string} eventName
     * @param {Object} detail
     */
    #dispatchEvent(eventName, detail) {
        if (!eventName) {
            throw new Error('AutoSave: eventName obrigatório');
        }

        const event = new CustomEvent(eventName, {
            detail: detail,
            bubbles: true,
            cancelable: false
        });

        document.dispatchEvent(event);
        console.log(`📡 Evento disparado: ${eventName}`, detail);
    }
}

// Exportação global (compatibilidade com módulos não-ES6)
if (typeof window !== 'undefined') {
    window.AutoSave = AutoSave;
}

console.log('✅ AutoSave carregado');
